import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import type { Environment, QueryResult } from "@sqlose/shared"
import type { Mock } from "vitest"

import { queryClient } from "./query/queryClient"
import { useEnvironmentStore } from "../stores/environmentStore"
import { useWorkspaceStore } from "../stores/workspaceStore"
import { useEditorStore } from "../stores/editorStore"
import { useSettingsStore } from "../stores/settingsStore"

import { TabBar } from "../components/TabBar"
import { EnvironmentActions } from "../components/EnvironmentActions"
import { ResultsPanel } from "../components/ResultsPanel"
import { SettingsPanel } from "../components/SettingsPanel"

function makeEnv(overrides: Partial<Environment> = {}): Environment {
   return {
      id: "env-1",
      name: "test-pg",
      dbType: "postgres",
      status: "running",
      port: 5432,
      uptime: 120,
      connectionString: "postgresql://localhost:5432/sqlose",
      containerId: "container-1",
      createdAt: "2025-01-01T00:00:00Z",
      ...overrides,
   }
}

function makeQueryResult(overrides: Partial<QueryResult> = {}): QueryResult {
   return {
      columns: ["id", "name"],
      rows: [{ id: 1, name: "hello" }],
      rowCount: 1,
      executionTimeMs: 5,
      ...overrides,
   }
}

function Wrapper({ children }: { children: React.ReactNode }) {
   return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

interface MockApi {
   env: {
      create: Mock
      list: Mock
      destroy: Mock
      get: Mock
      duplicate: Mock
   }
   query: {
      execute: Mock
   }
   docker: {
      startEnv: Mock
      stopEnv: Mock
      health: Mock
   }
}

function getMockApi() {
   return (window as unknown as { sqlose: MockApi }).sqlose
}

beforeEach(() => {
   queryClient.clear()
   useEnvironmentStore.setState({
      environments: [],
      selectedEnvironmentId: null,
      isLoading: false,
      error: null,
   })
   useWorkspaceStore.setState({
      tabs: [],
      activeTabId: null,
      paneSizes: { sidebarWidth: 280, editorHeight: 300, resultsHeight: 300 },
   })
   useEditorStore.setState({
      vimMode: "normal",
      vimEnabled: false,
      queryDraft: "",
      selectedEnvironmentId: null,
   })
   useSettingsStore.setState({
      vimModeEnabled: false,
      keybindings: [],
      theme: "dark",
      autoSave: true,
   })
})

afterEach(() => {
   vi.clearAllMocks()
})

describe("Workflow: Environment CRUD", () => {
   it("1a. creates environment via store and updates state", async () => {
      const api = getMockApi()
      api.env.create.mockResolvedValue({ success: true, data: makeEnv() })

      const result = await useEnvironmentStore.getState().createEnvironment("postgres", "test-pg")

      expect(result.isOk()).toBe(true)
      const state = useEnvironmentStore.getState()
      expect(state.environments).toHaveLength(1)
      expect(state.environments[0].name).toBe("test-pg")
      expect(state.environments[0].dbType).toBe("postgres")
      expect(api.env.create).toHaveBeenCalledWith({ dbType: "postgres", name: "test-pg" })
   })

   it("1b. fetches environments list via store", async () => {
      const api = getMockApi()
      const envs = [
         makeEnv({ id: "env-1" }),
         makeEnv({ id: "env-2", name: "env2", dbType: "mysql" }),
      ]
      api.env.list.mockResolvedValue({ success: true, data: envs })

      await act(async () => {
         await useEnvironmentStore.getState().fetchEnvironments()
      })

      const state = useEnvironmentStore.getState()
      expect(state.environments).toHaveLength(2)
   })

   it("1c. selects an environment", () => {
      useEnvironmentStore.setState({
         environments: [makeEnv()],
      })

      const result = useEnvironmentStore.getState().selectEnvironment("env-1")
      expect(result.isOk()).toBe(true)
      expect(useEnvironmentStore.getState().selectedEnvironmentId).toBe("env-1")
   })

   it("1d. rejects selection of non-existent environment", () => {
      const result = useEnvironmentStore.getState().selectEnvironment("nonexistent")
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
         expect(result.error.code).toBe("env:not_found")
      }
   })

   it("1e. destroys environment via store and removes from list", async () => {
      const api = getMockApi()
      api.env.destroy.mockResolvedValue({ success: true, data: { environmentId: "env-1" } })

      useEnvironmentStore.setState({
         environments: [makeEnv()],
         selectedEnvironmentId: "env-1",
      })

      await act(async () => {
         await useEnvironmentStore.getState().destroyEnvironment("env-1")
      })

      const state = useEnvironmentStore.getState()
      expect(state.environments).toHaveLength(0)
      expect(state.selectedEnvironmentId).toBeNull()
   })
})

describe("Workflow: Query Execution", () => {
   it("2a. executes query and returns result", async () => {
      const api = getMockApi()
      const queryResult = makeQueryResult()
      api.query.execute.mockResolvedValue({ success: true, data: queryResult })

      const tabResult = useWorkspaceStore.getState().openTab("env-1")
      expect(tabResult.isOk()).toBe(true)
      const tab = tabResult._unsafeUnwrap()

      useWorkspaceStore.getState().updateTab(tab.id, { query: "SELECT * FROM test" })

      const result = await api.query.execute({ environmentId: "env-1", sql: "SELECT * FROM test" })
      expect(result.success).toBe(true)
      if (result.success) {
         expect(result.data.columns).toEqual(["id", "name"])
         expect(result.data.rows).toHaveLength(1)
      }
   })

   it("2b. renders executing state in ResultsPanel", () => {
      render(
         <Wrapper>
            <ResultsPanel
               result={null}
               error={null}
               isExecuting={true}
               executionTimeMs={null}
               rowCount={null}
            />
         </Wrapper>
      )
      expect(screen.getByText("Executing query...")).toBeInTheDocument()
   })

   it("2c. renders query results in ResultsPanel", () => {
      const result = makeQueryResult({
         columns: ["col1", "col2"],
         rows: [{ col1: "a", col2: "b" }],
         rowCount: 1,
         executionTimeMs: 10,
      })

      render(
         <Wrapper>
            <ResultsPanel
               result={result}
               error={null}
               isExecuting={false}
               executionTimeMs={10}
               rowCount={1}
            />
         </Wrapper>
      )
      expect(screen.getByText("Results")).toBeInTheDocument()
      expect(screen.getByText("Messages")).toBeInTheDocument()
      expect(screen.getByText("Stats")).toBeInTheDocument()
   })

   it("2d. shows empty state when no result", () => {
      render(
         <Wrapper>
            <ResultsPanel
               result={null}
               error={null}
               isExecuting={false}
               executionTimeMs={null}
               rowCount={null}
            />
         </Wrapper>
      )
      expect(screen.getByText("Ready to run query")).toBeInTheDocument()
   })
})

describe("Workflow: Error Propagation", () => {
   it("3a. store handles query error from API", async () => {
      const api = getMockApi()
      api.query.execute.mockResolvedValue({
         success: false,
         error: { code: "query:execution_failed", message: "syntax error at line 1" },
      })

      const result = await api.query.execute({ environmentId: "env-1", sql: "BAD SQL" })
      expect(result.success).toBe(false)
      if (!result.success) {
         expect(result.error.code).toBe("query:execution_failed")
         expect(result.error.message).toBe("syntax error at line 1")
      }
   })

   it("3b. renders error state in ResultsPanel", () => {
      render(
         <Wrapper>
            <ResultsPanel
               result={null}
               error={"syntax error at line 1"}
               isExecuting={false}
               executionTimeMs={null}
               rowCount={null}
            />
         </Wrapper>
      )
      expect(screen.getByText("Query Execution Failed")).toBeInTheDocument()
      expect(screen.getByText("syntax error at line 1")).toBeInTheDocument()
   })

   it("3c. store handles environment creation failure", async () => {
      const api = getMockApi()
      api.env.create.mockResolvedValue({
         success: false,
         error: { code: "docker:port_conflict", message: "Port 5432 already in use" },
      })

      const result = await useEnvironmentStore.getState().createEnvironment("postgres")

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
         expect(result.error.code).toBe("docker:port_conflict")
      }
      const state = useEnvironmentStore.getState()
      expect(state.error).toBe("Port 5432 already in use")
      expect(state.environments).toHaveLength(0)
   })

   it("3d. store handles destroy failure", async () => {
      const api = getMockApi()
      api.env.destroy.mockResolvedValue({
         success: false,
         error: { code: "docker:container_failed", message: "Container not found" },
      })

      useEnvironmentStore.setState({
         environments: [makeEnv()],
      })

      const result = await useEnvironmentStore.getState().destroyEnvironment("env-1")

      expect(result.isErr()).toBe(true)
      const state = useEnvironmentStore.getState()
      expect(state.environments).toHaveLength(1)
   })
})

describe("Workflow: Vim Mode Toggle", () => {
   it("4a. toggles vim mode in settings store", () => {
      expect(useSettingsStore.getState().vimModeEnabled).toBe(false)

      act(() => {
         useSettingsStore.getState().toggleVimMode()
      })
      expect(useSettingsStore.getState().vimModeEnabled).toBe(true)

      act(() => {
         useSettingsStore.getState().toggleVimMode()
      })
      expect(useSettingsStore.getState().vimModeEnabled).toBe(false)
   })

   it("4b. sets vim mode in editor store", () => {
      const result = useEditorStore.getState().setVimMode("insert")
      expect(result.isOk()).toBe(true)
      expect(useEditorStore.getState().vimMode).toBe("insert")
   })

   it("4c. rejects invalid vim mode", () => {
      const result = useEditorStore.getState().setVimMode("invalid" as never)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
         expect(result.error.code).toBe("vim:mode_error")
      }
   })

   it("4d. syncs vim toggle between settings and editor", () => {
      useSettingsStore.setState({ vimModeEnabled: false })

      act(() => {
         useSettingsStore.getState().toggleVimMode()
      })

      expect(useSettingsStore.getState().vimModeEnabled).toBe(true)
   })

   it("4e. SettingsPanel renders vim toggle", () => {
      useEditorStore.setState({ vimEnabled: false })

      render(
         <Wrapper>
            <SettingsPanel isOpen={true} onClose={vi.fn()} />
         </Wrapper>
      )
      expect(screen.getByText("Vim Mode")).toBeInTheDocument()
      expect(screen.getByText("Enable Vim keybindings in the SQL editor")).toBeInTheDocument()
      expect(screen.getByLabelText("Toggle Vim mode")).toBeInTheDocument()
   })
})

describe("Workflow: Tab Management", () => {
   it("5a. opens new tabs", () => {
      const result = useWorkspaceStore.getState().openTab()
      expect(result.isOk()).toBe(true)
      expect(useWorkspaceStore.getState().tabs).toHaveLength(1)
   })

   it("5b. switches active tab", () => {
      useWorkspaceStore.setState({
         tabs: [
            {
               id: "tab-1",
               type: "query",
               title: "Q1",
               environmentId: null,
               isDirty: false,
               isExecuting: false,
               query: "",
               result: null,
               error: null,
               createdAt: "",
            },
            {
               id: "tab-2",
               type: "query",
               title: "Q2",
               environmentId: null,
               isDirty: false,
               isExecuting: false,
               query: "",
               result: null,
               error: null,
               createdAt: "",
            },
         ],
         activeTabId: "tab-1",
      })

      useWorkspaceStore.getState().setActiveTab("tab-2")
      expect(useWorkspaceStore.getState().activeTabId).toBe("tab-2")
   })

   it("5c. closes tab and activates next", () => {
      useWorkspaceStore.setState({
         tabs: [
            {
               id: "tab-1",
               type: "query",
               title: "Q1",
               environmentId: null,
               isDirty: false,
               isExecuting: false,
               query: "",
               result: null,
               error: null,
               createdAt: "",
            },
            {
               id: "tab-2",
               type: "query",
               title: "Q2",
               environmentId: null,
               isDirty: false,
               isExecuting: false,
               query: "",
               result: null,
               error: null,
               createdAt: "",
            },
         ],
         activeTabId: "tab-1",
      })

      const result = useWorkspaceStore.getState().closeTab("tab-1")
      expect(result.isOk()).toBe(true)
      const state = useWorkspaceStore.getState()
      expect(state.tabs).toHaveLength(1)
      expect(state.tabs[0].id).toBe("tab-2")
   })

   it("5d. renders tabs in TabBar", () => {
      useWorkspaceStore.setState({
         tabs: [
            {
               id: "tab-1",
               type: "query",
               title: "Query Alpha",
               environmentId: null,
               isDirty: false,
               isExecuting: false,
               query: "",
               result: null,
               error: null,
               createdAt: "2024-01-01T00:00:00Z",
            },
            {
               id: "tab-2",
               type: "query",
               title: "Query Beta",
               environmentId: null,
               isDirty: true,
               isExecuting: false,
               query: "",
               result: null,
               error: null,
               createdAt: "2024-01-01T00:00:00Z",
            },
         ],
         activeTabId: "tab-1",
      })

      render(<TabBar />)
      expect(screen.getByText("Query Alpha")).toBeInTheDocument()
      expect(screen.getByText("Query Beta")).toBeInTheDocument()
   })

   it("5e. closes tab via TabBar close button", async () => {
      const user = userEvent.setup()
      useWorkspaceStore.setState({
         tabs: [
            {
               id: "tab-1",
               type: "query",
               title: "Q1",
               environmentId: null,
               isDirty: false,
               isExecuting: false,
               query: "",
               result: null,
               error: null,
               createdAt: "2024-01-01T00:00:00Z",
            },
         ],
         activeTabId: "tab-1",
      })

      render(<TabBar />)
      await user.click(screen.getByLabelText("Close tab"))
      expect(useWorkspaceStore.getState().tabs).toHaveLength(1)
   })
})

describe("Workflow: Settings Persistence", () => {
   beforeEach(() => {
      useSettingsStore.setState({
         keybindings: [
            { action: "tab.new", key: "t", ctrl: false, shift: false, alt: false, meta: true },
         ],
      })
   })

   it("6a. toggles vim mode in settings store", () => {
      act(() => {
         useSettingsStore.getState().setVimModeEnabled(true)
      })
      expect(useSettingsStore.getState().vimModeEnabled).toBe(true)
   })

   it("6b. updates keybindings", () => {
      const binding = {
         action: "query.execute",
         key: "r",
         ctrl: true,
         shift: false,
         alt: false,
         meta: false,
      }
      act(() => {
         useSettingsStore.getState().updateKeybinding(0, binding)
      })
      expect(useSettingsStore.getState().keybindings[0]).toEqual(binding)
   })

   it("6c. resets keybindings to defaults", () => {
      act(() => {
         useSettingsStore.getState().resetKeybindings()
      })
      expect(useSettingsStore.getState().keybindings.length).toBeGreaterThan(0)
      expect(useSettingsStore.getState().keybindings[0].action).toBe("query.execute")
   })

   it("6d. SettingsPanel shows keybinding list", () => {
      useSettingsStore.setState({
         vimModeEnabled: false,
         keybindings: [
            {
               action: "query.execute",
               key: "Enter",
               ctrl: false,
               shift: false,
               alt: false,
               meta: true,
            },
         ],
      })

      render(
         <Wrapper>
            <SettingsPanel isOpen={true} onClose={vi.fn()} />
         </Wrapper>
      )
      expect(screen.getByText("Keybindings")).toBeInTheDocument()
      expect(screen.getByText("Execute Query")).toBeInTheDocument()
   })
})

describe("Workflow: Environment Actions Lifecycle", () => {
   it("7a. starts environment via store", async () => {
      const api = getMockApi()
      api.docker.startEnv.mockResolvedValue({
         success: true,
         data: { environmentId: "env-1", port: 5432, connectionString: "postgresql://..." },
      })
      api.env.get.mockResolvedValue({
         success: true,
         data: makeEnv({ status: "running", uptime: 300 }),
      })

      useEnvironmentStore.setState({ environments: [makeEnv({ status: "stopped" })] })

      await act(async () => {
         await useEnvironmentStore.getState().startEnvironment("env-1")
      })

      const env = useEnvironmentStore.getState().environments[0]
      expect(env.status).toBe("running")
   })

   it("7b. stops environment via store", async () => {
      const api = getMockApi()
      api.docker.stopEnv.mockResolvedValue({ success: true, data: { environmentId: "env-1" } })
      api.env.get.mockResolvedValue({
         success: true,
         data: makeEnv({ status: "stopped", uptime: null }),
      })

      useEnvironmentStore.setState({ environments: [makeEnv()] })

      await act(async () => {
         await useEnvironmentStore.getState().stopEnvironment("env-1")
      })

      const env = useEnvironmentStore.getState().environments[0]
      expect(env.status).toBe("stopped")
   })

   it("7c. EnvironmentActions shows correct buttons for running state", () => {
      render(<EnvironmentActions environment={makeEnv()} />)
      expect(screen.getByText("test-pg")).toBeInTheDocument()
      expect(screen.getByText("running")).toBeInTheDocument()
      expect(screen.getByText("Start")).toBeDisabled()
      expect(screen.getByText("Stop")).toBeEnabled()
      expect(screen.getByText("Restart")).toBeEnabled()
   })

   it("7d. EnvironmentActions shows Start enabled for stopped env", () => {
      render(<EnvironmentActions environment={makeEnv({ status: "stopped", uptime: null })} />)
      expect(screen.getByText("Start")).toBeEnabled()
      expect(screen.getByText("Stop")).toBeDisabled()
      expect(screen.getByText("Restart")).toBeDisabled()
   })

   it("7e. duplicates environment via store", async () => {
      const api = getMockApi()
      const dupEnv = makeEnv({ id: "env-2", name: "test-pg (copy)" })
      api.env.duplicate.mockResolvedValue({ success: true, data: dupEnv })

      useEnvironmentStore.setState({ environments: [makeEnv()] })

      await act(async () => {
         await useEnvironmentStore.getState().duplicateEnvironment("env-1")
      })

      expect(useEnvironmentStore.getState().environments).toHaveLength(2)
   })
})
