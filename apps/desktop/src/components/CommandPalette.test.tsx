import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CommandPalette } from "./CommandPalette"
import { useEnvironmentStore } from "../stores/environmentStore"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

function renderWithQuery(ui: React.ReactElement) {
   const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
   })
   return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe("CommandPalette", () => {
   beforeEach(() => {
      useEnvironmentStore.setState({
         environments: [],
         selectedEnvironmentId: null,
         isLoading: false,
         error: null,
      })
   })

   it("does not render when closed", () => {
      renderWithQuery(<CommandPalette isOpen={false} onClose={() => {}} />)
      expect(
         screen.queryByPlaceholderText("Search tables, queries, commands...")
      ).not.toBeInTheDocument()
   })

   it("renders when open", () => {
      renderWithQuery(<CommandPalette isOpen={true} onClose={() => {}} />)
      expect(screen.getByPlaceholderText("Search tables, queries, commands...")).toBeInTheDocument()
   })

   it("shows New Query action", () => {
      renderWithQuery(<CommandPalette isOpen={true} onClose={() => {}} />)
      expect(screen.getByText("New Query")).toBeInTheDocument()
   })

   it("shows environments in the list", () => {
      useEnvironmentStore.setState({
         environments: [
            {
               id: "env-1",
               name: "Test PG",
               dbType: "postgres",
               status: "running",
               port: 5432,
               uptime: 100,
               connectionString: "",
               containerId: "c1",
               createdAt: "2024-01-01T00:00:00Z",
            },
         ],
      })

      renderWithQuery(<CommandPalette isOpen={true} onClose={() => {}} />)
      expect(screen.getByText("Test PG")).toBeInTheDocument()
   })

   it("calls onClose when clicking backdrop", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      renderWithQuery(<CommandPalette isOpen={true} onClose={onClose} />)

      const backdrop = screen.getByText("New Query").closest("[class*='fixed']")
      if (backdrop) {
         await user.click(backdrop)
         expect(onClose).toHaveBeenCalled()
      }
   })

   it("calls onClose on Escape key", () => {
      const onClose = vi.fn()

      renderWithQuery(<CommandPalette isOpen={true} onClose={onClose} />)

      act(() => {
         window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
      })

      expect(onClose).toHaveBeenCalled()
   })
})
