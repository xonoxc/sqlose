import { useState, type ReactNode } from "react"
import { cn } from "./cn"
import { Badge } from "./badge"
import { IconChevronRight } from "@tabler/icons-react"

export interface SidebarItem {
   id: string
   label: string
   icon?: ReactNode
   badge?: string
   badgeVariant?: "default" | "secondary" | "success" | "warning" | "destructive"
   children?: SidebarItem[]
}

interface SidebarProps {
   items: SidebarItem[]
   selectedId?: string
   onSelect?: (id: string) => void
   className?: string
   header?: ReactNode
}

function SidebarItemRow({
   item,
   depth,
   selectedId,
   onSelect,
   defaultExpanded,
}: {
   item: SidebarItem
   depth: number
   selectedId?: string
   onSelect?: (id: string) => void
   defaultExpanded: boolean
}) {
   const [expanded, setExpanded] = useState(defaultExpanded)
   const hasChildren = item.children && item.children.length > 0
   const isSelected = selectedId === item.id

   return (
      <div>
         <button
            onClick={() => {
               if (hasChildren) setExpanded(!expanded)
               onSelect?.(item.id)
            }}
            className={cn(
               "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all outline-none",
               "text-text-secondary hover:text-text-primary hover:bg-bg-quaternary/40",
               isSelected && "bg-bg-quaternary text-accent shadow-sm"
            )}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
         >
            {hasChildren && (
               <IconChevronRight
                  className={cn(
                     "h-3.5 w-3.5 transition-transform shrink-0",
                     expanded && "rotate-90"
                  )}
               />
            )}
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span className="truncate flex-1 text-left">{item.label}</span>
            {item.badge && (
               <Badge
                  variant={item.badgeVariant ?? "secondary"}
                  className="text-[10px] px-1.5 py-0"
               >
                  {item.badge}
               </Badge>
            )}
         </button>
         {hasChildren && expanded && (
            <div>
               {item.children!.map(child => (
                  <SidebarItemRow
                     key={child.id}
                     item={child}
                     depth={depth + 1}
                     selectedId={selectedId}
                     onSelect={onSelect}
                     defaultExpanded={false}
                  />
               ))}
            </div>
         )}
      </div>
   )
}

export function Sidebar({ items, selectedId, onSelect, className, header }: SidebarProps) {
   return (
      <div className={cn("flex h-full flex-col bg-[#111111] text-[#909090] w-full", className)}>
         {header && (
            <div className="px-3 pt-6 pb-2 min-h-[64px] flex items-center shrink-0 app-drag-region">
               {header}
            </div>
         )}
         <div className="flex-1 overflow-y-auto px-2 py-0 custom-scrollbar app-no-drag relative">
            {items.map(item => (
               <SidebarItemRow
                  key={item.id}
                  item={item}
                  depth={0}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  defaultExpanded={true}
               />
            ))}
         </div>
      </div>
   )
}
