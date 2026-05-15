import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
   Modal,
   ModalTrigger,
   ModalContent,
   ModalHeader,
   ModalTitle,
   ModalDescription,
   ModalFooter,
   ModalClose,
} from "./modal"
import { Button } from "./button"

describe("Modal", () => {
   it("opens and shows content when triggered", async () => {
      const user = userEvent.setup()
      render(
         <Modal>
            <ModalTrigger asChild>
               <Button>Open Modal</Button>
            </ModalTrigger>
            <ModalContent>
               <ModalHeader>
                  <ModalTitle>Modal Title</ModalTitle>
                  <ModalDescription>Modal description</ModalDescription>
               </ModalHeader>
               <ModalFooter>
                  <ModalClose asChild>
                     <Button variant="outline">Cancel</Button>
                  </ModalClose>
               </ModalFooter>
            </ModalContent>
         </Modal>
      )

      expect(screen.queryByText("Modal Title")).not.toBeInTheDocument()
      await user.click(screen.getByText("Open Modal"))
      expect(screen.getByText("Modal Title")).toBeInTheDocument()
      expect(screen.getByText("Modal description")).toBeInTheDocument()
   })

   it("closes when close button is clicked", async () => {
      const user = userEvent.setup()
      render(
         <Modal defaultOpen>
            <ModalContent>
               <ModalTitle>Title</ModalTitle>
               <ModalClose asChild>
                  <Button aria-label="Close dialog">Close</Button>
               </ModalClose>
            </ModalContent>
         </Modal>
      )

      expect(screen.getByText("Title")).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Close dialog" }))
      expect(screen.queryByText("Title")).not.toBeInTheDocument()
   })
})
