import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SQLEditor } from "./SQLEditor"
import { useEditorStore } from "../stores/editorStore"
import { useEnvironmentStore } from "../stores/environmentStore"
import { useSettingsStore } from "../stores/settingsStore"

vi.mock("@monaco-editor/react", () => ({
   default: function MockEditor({
      value,
      onChange,
   }: {
      value?: string
      onChange?: (value: string) => void
   }) {
      return (
         <div data-testid="monaco-editor" data-value={value}>
            <textarea
               data-testid="editor-textarea"
               value={value || ""}
               onChange={e => onChange?.(e.target.value)}
            />
         </div>
      )
   },
}))

vi.mock("monaco-vim", () => ({
   initVimMode: vi.fn(() => ({
      dispose: vi.fn(),
   })),
}))

describe("SQLEditor", () => {
   const defaultProps = {
      value: "SELECT * FROM users;",
      onChange: vi.fn(),
      onExecute: vi.fn(),
      onSettingsOpen: vi.fn(),
      isExecuting: false,
      executionTimeMs: null,
   }

   beforeEach(() => {
      useEditorStore.setState({
         vimMode: "normal",
         vimEnabled: false,
         queryDraft: "SELECT * FROM users;",
         selectedEnvironmentId: null,
      })
      useEnvironmentStore.setState({
         environments: [],
         selectedEnvironmentId: null,
         isLoading: false,
         error: null,
      })
      useSettingsStore.setState({
         vimModeEnabled: false,
         keybindings: [],
         theme: "dark",
         autoSave: true,
      })
   })

   it("renders the editor", async () => {
      render(<SQLEditor {...defaultProps} />)
      expect(await screen.findByTestId("monaco-editor")).toBeInTheDocument()
   })

   it("renders Run button", () => {
      render(<SQLEditor {...defaultProps} />)
      expect(screen.getByText("Run Query")).toBeInTheDocument()
   })

   it("shows execution time when provided", () => {
      render(<SQLEditor {...defaultProps} executionTimeMs={42} />)
      expect(screen.getByText("42ms")).toBeInTheDocument()
   })

   it("calls onExecute when Run clicked", async () => {
      const user = userEvent.setup()
      const onExecute = vi.fn()

      useEditorStore.setState({ selectedEnvironmentId: "env-1" })
      useEnvironmentStore.setState({
         environments: [
            {
               id: "env-1",
               name: "Test",
               dbType: "postgres",
               status: "running",
               port: 5432,
               uptime: null,
               connectionString: "",
               containerId: "c1",
               createdAt: "2024-01-01T00:00:00Z",
            },
         ],
         selectedEnvironmentId: "env-1",
      })

      render(<SQLEditor {...defaultProps} onExecute={onExecute} />)
      await user.click(screen.getByText("Run Query"))
      expect(onExecute).toHaveBeenCalledOnce()
   })

   it("calls onSettingsOpen when settings clicked", async () => {
      const user = userEvent.setup()
      const onSettingsOpen = vi.fn()

      render(<SQLEditor {...defaultProps} onSettingsOpen={onSettingsOpen} />)
      await user.click(screen.getByLabelText("Settings"))
      expect(onSettingsOpen).toHaveBeenCalledOnce()
   })

   it("calls onChange when editor text changes", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()

      render(<SQLEditor {...defaultProps} onChange={onChange} />)
      const textarea = screen.getByTestId("editor-textarea")
      await user.clear(textarea)
      await user.type(textarea, "SELECT 1")
      expect(onChange).toHaveBeenCalled()
   })
})
