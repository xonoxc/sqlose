import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ResizablePane } from "./resizable-pane"

describe("ResizablePane", () => {
   it("renders left and right panels", () => {
      render(<ResizablePane left={<div>Left Panel</div>} right={<div>Right Panel</div>} />)
      expect(screen.getByText("Left Panel")).toBeInTheDocument()
      expect(screen.getByText("Right Panel")).toBeInTheDocument()
   })

   it("renders resize handle", () => {
      const { container } = render(
         <ResizablePane left={<div>Left</div>} right={<div>Right</div>} />
      )
      const handle = container.querySelector('[class*="cursor-col-resize"]')
      expect(handle).toBeInTheDocument()
   })

   it("applies custom className", () => {
      const { container } = render(
         <ResizablePane left={<div>Left</div>} right={<div>Right</div>} className="custom-class" />
      )
      const pane = container.firstChild as HTMLElement
      expect(pane.className).toContain("custom-class")
   })
})
