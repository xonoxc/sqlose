import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Sidebar } from "./sidebar"

const items = [
   {
      id: "envs",
      label: "Environments",
      children: [
         { id: "env-1", label: "Postgres Dev" },
         { id: "env-2", label: "MySQL Staging" },
      ],
   },
   { id: "datasets", label: "Datasets", badge: "4", badgeVariant: "secondary" as const },
]

describe("Sidebar", () => {
   it("renders top-level items", () => {
      render(<Sidebar items={items} />)
      expect(screen.getByText("Environments")).toBeInTheDocument()
      expect(screen.getByText("Datasets")).toBeInTheDocument()
   })

   it("shows child items when parent is expanded by default", () => {
      render(<Sidebar items={items} />)
      expect(screen.getByText("Postgres Dev")).toBeInTheDocument()
      expect(screen.getByText("MySQL Staging")).toBeInTheDocument()
   })

   it("toggles children visibility on click", async () => {
      const user = userEvent.setup()
      render(<Sidebar items={items} />)

      const envToggle = screen.getByText("Environments")
      expect(screen.getByText("Postgres Dev")).toBeInTheDocument()

      await user.click(envToggle)
      expect(screen.queryByText("Postgres Dev")).not.toBeInTheDocument()
   })

   it("renders badge when provided", () => {
      render(<Sidebar items={items} />)
      expect(screen.getByText("4")).toBeInTheDocument()
   })

   it("calls onSelect when item is clicked", async () => {
      const user = userEvent.setup()
      let selected = ""
      render(
         <Sidebar
            items={items}
            onSelect={id => {
               selected = id
            }}
         />
      )

      await user.click(screen.getByText("Datasets"))
      expect(selected).toBe("datasets")
   })

   it("renders custom header", () => {
      render(<Sidebar items={items} header={<div>Custom Header</div>} />)
      expect(screen.getByText("Custom Header")).toBeInTheDocument()
   })
})
