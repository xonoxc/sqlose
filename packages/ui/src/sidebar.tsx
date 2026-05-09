import { useState, type ReactNode } from "react"
import { cn } from "./cn"
import { Input } from "./input"
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
   searchPlaceholder?: string
   showSearch?: boolean
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
               "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all duration-200 outline-none",
               "text-text-secondary hover:text-text-primary hover:bg-bg-quaternary/40",
               isSelected && "bg-bg-quaternary text-accent shadow-sm"
            )}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
         >
            {hasChildren && (
               <IconChevronRight
                  className={cn("h-3.5 w-3.5 transition-transform shrink-0", expanded && "rotate-90")}
               />
            )}
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span className="truncate flex-1 text-left">{item.label}</span>
            {item.badge && (
               <Badge variant={item.badgeVariant ?? "secondary"} className="text-[10px] px-1.5 py-0">
                  {item.badge}
               </Badge>
            )}
         </button>
         {hasChildren && expanded && (
            <div>
               {item.children!.map((child) => (
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

export function Sidebar({
   items,
   selectedId,
   onSelect,
   searchPlaceholder = "Search...",
   showSearch = true,
   className,
   header,
}: SidebarProps) {
   const [search, setSearch] = useState("")

   const filteredItems = items.filter((item) => {
      if (!search) return true
      const q = search.toLowerCase()
      return item.label.toLowerCase().includes(q)
   })

   return (
      <div className={cn("flex h-full flex-col bg-[#111111] text-[#909090] w-full", className)}>
         {header && <div className="px-3 pt-6 pb-2 min-h-[64px] flex items-center shrink-0 app-drag-region">{header}</div>}
         
         <div className="flex items-center justify-between px-5 py-2 app-no-drag w-full">
            <div className="flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="9" y2="21"/><line x1="15" x2="15" y1="9" y2="21"/></svg>
               <span className="text-[12px] font-medium text-text-primary/90">Tables</span>
            </div>
            <div className="flex items-center gap-3">
               <button className="hover:text-text-primary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg></button>
               <button className="hover:text-text-primary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></button>
               <button className="hover:text-text-primary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button>
            </div>
         </div>
         
         <div className="px-5 mb-4 mt-2 app-no-drag">
            <div className="flex items-center bg-[#161616] rounded-md border border-[#1e1e1e] p-0.5 w-max">
               <button className="px-3 py-1 bg-[#222] text-text-primary text-[11px] font-medium rounded shadow-sm">A-Z</button>
               <button className="px-3 py-1 text-text-muted hover:text-text-primary text-[11px] font-medium rounded transition-colors">Tags</button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto px-2 py-0 custom-scrollbar app-no-drag relative">
            {filteredItems.map((item) => (
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
