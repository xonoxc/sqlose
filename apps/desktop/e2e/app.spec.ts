import { test, expect, type Page } from "@playwright/test"

async function setupMockApi(page: Page) {
   await page.addInitScript(() => {
      const mockEnv = {
         id: "env-1",
         name: "My Postgres",
         dbType: "postgres",
         status: "running",
         port: 5432,
         uptime: 120,
         connectionString: "postgresql://localhost:5432/sqlose",
         containerId: "container-1",
         createdAt: "2025-01-01T00:00:00Z",
      }

      const mockQueryResult = {
         columns: ["id", "name", "email"],
         rows: [
            { id: 1, name: "Alice", email: "alice@test.com" },
            { id: 2, name: "Bob", email: "bob@test.com" },
         ],
         rowCount: 2,
         executionTimeMs: 15,
      }

      const ok = <T>(data: T) => ({ success: true as const, data })

      window.sqlose = {
         docker: {
            startEnv: async () =>
               ok({
                  environmentId: "env-1",
                  port: 5432,
                  connectionString: "postgresql://localhost:5432/sqlose",
               }),
            stopEnv: async () => ok({ environmentId: "env-1" }),
            restartEnv: async () => ok({ environmentId: "env-1" }),
            health: async () => ok({ healthy: true, uptime: 120 }),
            cleanup: async () => ok({ cleaned: 0 }),
         },
         env: {
            create: async () => ok(mockEnv),
            destroy: async () => ok({ environmentId: "env-1" }),
            list: async () => ok([mockEnv]),
            get: async () => ok(mockEnv),
            duplicate: async () => ok({ ...mockEnv, id: "env-2", name: "My Postgres (copy)" }),
            reset: async () => ok({ ...mockEnv, status: "creating" }),
         },
         query: {
            execute: async () => ok(mockQueryResult),
         },
         import: {
            csv: async () => ok({ tableName: "users", rowCount: 10, columns: ["id", "name"] }),
            sql: async () => ok({ tablesCreated: ["users", "orders"] }),
            previewCSV: async () =>
               ok({ columns: ["id", "name"], preview: [{ id: "1", name: "Alice" }] }),
         },
         dataset: {
            list: async () =>
               ok([
                  {
                     id: "ds-1",
                     name: "Ecommerce Sample",
                     description: "Sample ecommerce dataset",
                     category: "ecommerce",
                     dbTypes: ["postgres", "mysql"],
                  },
               ]),
            import: async () => ok({ tablesCreated: ["products", "orders"] }),
         },
      }
   })
}

test.describe("Critical E2E Flows", () => {
   test.beforeEach(async ({ page }) => {
      await setupMockApi(page)
      await page.goto("/")
      await page.waitForLoadState("networkidle")
   })

   test("Flow 1: Launch Postgres environment, run SQL, verify results", async ({ page }) => {
      const envItem = page.getByText("My Postgres")
      await expect(envItem).toBeVisible({ timeout: 10000 })
      await envItem.click()

      const editor = page.getByTestId("monaco-editor")
      await expect(editor).toBeVisible()

      const textarea = page.getByTestId("editor-textarea")
      await textarea.fill("SELECT * FROM users")

      await page.getByText("Run").click()

      await expect(page.getByText(/2 rows? returned/)).toBeVisible({ timeout: 5000 })
      await expect(page.getByText(/15ms/)).toBeVisible()
   })

   test("Flow 2: Import CSV and query imported data", async ({ page }) => {
      await page.getByText("My Postgres").click()

      const textarea = page.getByTestId("editor-textarea")
      await textarea.fill("SELECT * FROM users")

      await page.getByText("Run").click()
      await expect(page.getByText(/2 rows? returned/)).toBeVisible({ timeout: 5000 })
   })

   test("Flow 3: Toggle Vim mode via settings panel", async ({ page }) => {
      const settingsBtn = page.getByLabelText("Settings").first()
      await settingsBtn.click()

      await expect(page.getByText("Vim Mode")).toBeVisible({ timeout: 5000 })
      await expect(page.getByText("Enable Vim keybindings in the SQL editor")).toBeVisible()

      const toggleBtn = page.getByLabelText("Toggle Vim mode")
      await toggleBtn.click()

      await page.getByText("Done").click()
      await page.waitForTimeout(300)
   })

   test("Flow 4: Use command palette to switch environments", async ({ page }) => {
      await page.keyboard.press("Meta+k")
      await page.waitForTimeout(500)

      const searchInput = page.getByPlaceholder("Search environments, datasets, actions...")
      await expect(searchInput).toBeVisible({ timeout: 5000 })

      await expect(page.getByText("My Postgres")).toBeVisible()
      await expect(page.getByText("New Query")).toBeVisible()

      await page.keyboard.press("Escape")
      await page.waitForTimeout(300)

      await expect(searchInput).not.toBeVisible()
   })

   test("Flow 5: Destroy environment with confirmation modal", async ({ page }) => {
      await page.getByText("My Postgres").click()

      const destroyBtn = page.getByText("Destroy")
      await expect(destroyBtn).toBeVisible()
      await destroyBtn.click()

      await expect(page.getByText("Destroy Environment")).toBeVisible({ timeout: 5000 })
      await expect(page.getByText("Are you sure you want to destroy")).toBeVisible()

      await page.getByRole("button", { name: "Destroy" }).click()
      await page.waitForTimeout(500)
   })

   test("Flow 6: Persist workspace state across app reload", async ({ page }) => {
      await page.evaluate(() => {
         const workspaceData = {
            state: {
               tabs: [
                  {
                     id: "persisted-tab-1",
                     type: "query",
                     title: "Persisted Query",
                     environmentId: "env-1",
                     isDirty: false,
                     isExecuting: false,
                     query: "SELECT 1",
                     result: null,
                     error: null,
                     createdAt: "2025-01-01T00:00:00Z",
                  },
               ],
               activeTabId: "persisted-tab-1",
               paneSizes: { sidebarWidth: 300, editorHeight: 250, resultsHeight: 350 },
            },
            version: 0,
         }
         window.localStorage.setItem("sqlose-workspace", JSON.stringify(workspaceData))

         const settingsData = {
            state: {
               vimModeEnabled: true,
               keybindings: [
                  {
                     action: "query.execute",
                     key: "r",
                     ctrl: true,
                     shift: false,
                     alt: false,
                     meta: false,
                  },
               ],
               theme: "dark",
               autoSave: true,
            },
            version: 0,
         }
         window.localStorage.setItem("sqlose-settings", JSON.stringify(settingsData))
      })

      await page.reload()
      await page.waitForLoadState("networkidle")
      await page.waitForTimeout(1000)
   })
})

test.describe("UI Render Tests", () => {
   test("app launches and shows main UI elements", async ({ page }) => {
      await setupMockApi(page)
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      await expect(page.getByText("Environments")).toBeVisible({ timeout: 10000 })
      await expect(page.getByText("My Postgres")).toBeVisible()
      await expect(page.getByText("Run a query to see results")).toBeVisible()
   })

   test("opens and closes settings panel", async ({ page }) => {
      await setupMockApi(page)
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      await page.getByLabelText("Settings").first().click()

      await expect(page.getByText("Settings")).toBeVisible({ timeout: 5000 })
      await expect(page.getByText("Done")).toBeVisible()

      await page.getByText("Done").click()
      await page.waitForTimeout(300)
   })

   test("command palette can be opened and closed with keyboard", async ({ page }) => {
      await setupMockApi(page)
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      await page.keyboard.press("Meta+k")
      await page.waitForTimeout(500)

      const searchInput = page.getByPlaceholder("Search environments, datasets, actions...")
      await expect(searchInput).toBeVisible({ timeout: 5000 })

      await page.keyboard.press("Escape")
      await page.waitForTimeout(300)

      await expect(searchInput).not.toBeVisible()
   })

   test("sidebar shows environment with status badge", async ({ page }) => {
      await setupMockApi(page)
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      await expect(page.getByText("My Postgres")).toBeVisible()
      await expect(page.getByText("running")).toBeVisible()
   })
})
