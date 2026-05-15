import { type HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./cn"

export const badgeVariants = cva(
   "inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-accent",
   {
      variants: {
         variant: {
            default: "bg-accent/15 text-accent-light",
            secondary: "bg-bg-quaternary text-text-secondary",
            destructive: "bg-error/15 text-error",
            success: "bg-success/15 text-success",
            warning: "bg-warning/15 text-warning",
            outline: "text-text-secondary border-border border bg-transparent",
         },
      },
      defaultVariants: {
         variant: "default",
      },
   }
)

export interface BadgeProps
   extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
   return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
