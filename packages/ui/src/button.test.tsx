import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "./button"

describe("Button", () => {
   it("renders children", () => {
      render(
         <Button variant="default" size="default">
            Click me
         </Button>
      )
      expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument()
   })

   it("applies default variant classes", () => {
      render(<Button>Default</Button>)
      const btn = screen.getByRole("button")
      expect(btn.className).toContain("bg-accent")
   })

   it("applies destructive variant classes", () => {
      render(<Button variant="destructive">Delete</Button>)
      const btn = screen.getByRole("button")
      expect(btn.className).toContain("bg-error")
   })

   it("applies outline variant classes", () => {
      render(<Button variant="outline">Outline</Button>)
      const btn = screen.getByRole("button")
      expect(btn.className).toContain("border-border")
   })

   it("applies size classes", () => {
      render(<Button size="sm">Small</Button>)
      const btn = screen.getByRole("button")
      expect(btn.className).toContain("h-8")
   })

   it("renders as child when asChild is true", () => {
      render(
         <Button asChild>
            <a href="/test">Link Button</a>
         </Button>
      )
      const link = screen.getByRole("link")
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute("href", "/test")
   })

   it("handles click events", async () => {
      const user = userEvent.setup()
      let clicked = false
      render(
         <Button
            onClick={() => {
               clicked = true
            }}
         >
            Click
         </Button>
      )
      await user.click(screen.getByRole("button"))
      expect(clicked).toBe(true)
   })

   it("is disabled when disabled prop is set", () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole("button")).toBeDisabled()
   })

   it("renders with icon size", () => {
      render(
         <Button size="icon">
            <span>X</span>
         </Button>
      )
      const btn = screen.getByRole("button")
      expect(btn.className).toContain("w-9")
   })
})
