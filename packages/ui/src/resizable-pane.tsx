import { useState, useCallback, useRef, useEffect, type ReactNode } from "react"
import { cn } from "./cn"

interface ResizablePaneProps {
   left: ReactNode
   right: ReactNode
   defaultLeftWidth?: number
   minLeftWidth?: number
   maxLeftWidth?: number
   className?: string
   onResize?: (leftWidth: number) => void
}

export function ResizablePane({
   left,
   right,
   defaultLeftWidth = 300,
   minLeftWidth = 200,
   maxLeftWidth = 600,
   className,
   onResize,
}: ResizablePaneProps) {
   const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
   const [isDragging, setIsDragging] = useState(false)
   const containerRef = useRef<HTMLDivElement>(null)

   const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
   }, [])

   const handleMouseMove = useCallback(
      (e: MouseEvent) => {
         if (!isDragging || !containerRef.current) return
         const rect = containerRef.current.getBoundingClientRect()
         let newWidth = e.clientX - rect.left
         newWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newWidth))
         setLeftWidth(newWidth)
         onResize?.(newWidth)
      },
      [isDragging, minLeftWidth, maxLeftWidth, onResize]
   )

   const handleMouseUp = useCallback(() => {
      setIsDragging(false)
   }, [])

   useEffect(() => {
      if (isDragging) {
         document.addEventListener("mousemove", handleMouseMove)
         document.addEventListener("mouseup", handleMouseUp)
         document.body.style.cursor = "col-resize"
         document.body.style.userSelect = "none"
         return () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
            document.body.style.cursor = ""
            document.body.style.userSelect = ""
         }
      }
   }, [isDragging, handleMouseMove, handleMouseUp])

   return (
      <div ref={containerRef} className={cn("flex h-full w-full overflow-hidden", className)}>
         {!!left && (
            <div style={{ width: leftWidth, flexShrink: 0 }} className="overflow-hidden">
               {left}
            </div>
         )}
         {!!left && (
            <div
               className={cn(
                  "relative w-1.5 cursor-col-resize bg-transparent hover:bg-accent/30 transition-colors shrink-0",
                  isDragging && "bg-accent/50"
               )}
               onMouseDown={handleMouseDown}
            >
               <div className="absolute inset-y-0 -left-1 -right-1" />
            </div>
         )}
         <div className="flex-1 overflow-hidden min-w-0">{right}</div>
      </div>
   )
}
