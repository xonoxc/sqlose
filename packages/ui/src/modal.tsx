import { forwardRef } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "./cn"
import { IconX } from "@tabler/icons-react"

export const Modal = DialogPrimitive.Root
export const ModalTrigger = DialogPrimitive.Trigger
export const ModalClose = DialogPrimitive.Close
export const ModalPortal = DialogPrimitive.Portal

export const ModalOverlay = forwardRef<
   React.ComponentRef<typeof DialogPrimitive.Overlay>,
   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
   <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
         "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
         "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
         className
      )}
      {...props}
   />
))
ModalOverlay.displayName = "ModalOverlay"

export const ModalContent = forwardRef<
   React.ComponentRef<typeof DialogPrimitive.Content>,
   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
   <DialogPrimitive.Portal>
      <ModalOverlay />
      <DialogPrimitive.Content
         ref={ref}
         className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-lg border border-border bg-bg-secondary p-6 shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            className
         )}
         {...props}
      >
         {children}
         <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-accent disabled:pointer-events-none">
            <IconX className="h-4 w-4 text-text-muted" />
            <span className="sr-only">Close</span>
         </DialogPrimitive.Close>
      </DialogPrimitive.Content>
   </DialogPrimitive.Portal>
))
ModalContent.displayName = "ModalContent"

export const ModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
   <div
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
   />
)
ModalHeader.displayName = "ModalHeader"

export const ModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
   <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
   />
)
ModalFooter.displayName = "ModalFooter"

export const ModalTitle = forwardRef<
   React.ComponentRef<typeof DialogPrimitive.Title>,
   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
   <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold text-text-primary", className)}
      {...props}
   />
))
ModalTitle.displayName = "ModalTitle"

export const ModalDescription = forwardRef<
   React.ComponentRef<typeof DialogPrimitive.Description>,
   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
   <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-text-muted", className)}
      {...props}
   />
))
ModalDescription.displayName = "ModalDescription"
