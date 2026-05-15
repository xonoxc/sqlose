import { forwardRef, type ButtonHTMLAttributes } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./cn"

export const buttonVariants = cva(
   "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
   {
      variants: {
         variant: {
            default: "bg-accent text-bg-primary hover:opacity-90 shadow-sm",
            destructive: "bg-error text-white hover:opacity-90 shadow-sm",
            outline:
               "border border-border/50 bg-transparent hover:bg-bg-quaternary/50 hover:text-text-primary",
            secondary:
               "bg-bg-quaternary/80 text-text-secondary hover:bg-bg-quaternary hover:text-text-primary",
            ghost: "text-text-secondary hover:bg-bg-quaternary/60 hover:text-text-primary",
            link: "text-accent underline-offset-4 hover:underline",
            success: "bg-success text-bg-primary hover:opacity-90 shadow-sm",
         },
         size: {
            default: "h-9 px-4 py-2",
            sm: "h-8 rounded-md px-3 text-xs",
            lg: "h-10 rounded-md px-8",
            icon: "h-9 w-9",
         },
      },
      defaultVariants: {
         variant: "default",
         size: "default",
      },
   }
)

interface ButtonProps
   extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
   asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
   ({ className, variant, size, asChild = false, ...props }, ref) => {
      const Comp = asChild ? Slot : "button"
      return (
         <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
      )
   }
)
Button.displayName = "Button"
