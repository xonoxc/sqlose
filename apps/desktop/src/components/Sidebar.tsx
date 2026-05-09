import { useCallback } from "react"
import { Sidebar as SidebarUI, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@sqlose/ui"
import type { Environment } from "@sqlose/shared"
import type { SidebarItem } from "@sqlose/ui"
import { useEnvironmentStore } from "../stores/environmentStore"
import { useEditorStore } from "../stores/editorStore"

interface AppSidebarProps {
   onSettingsOpen: () => void
   onClose: () => void
}


export function AppSidebar({ onSettingsOpen, onClose }: AppSidebarProps) {
   const environments = useEnvironmentStore((s) => s.environments)
   const selectedEnvironmentId = useEnvironmentStore((s) => s.selectedEnvironmentId)
   const selectEnvironment = useEnvironmentStore((s) => s.selectEnvironment)
   const setSelectedEnvironment = useEditorStore((s) => s.setSelectedEnvironment)

   const handleSelect = useCallback(
      (id: string) => {
         selectEnvironment(id)
         setSelectedEnvironment(id)
      },
      [selectEnvironment, setSelectedEnvironment],
   )

   const tableItems: SidebarItem[] = []

   return (
      <SidebarUI
         items={tableItems}
         selectedId={undefined}
         onSelect={() => {}}
         searchPlaceholder=""
         header={
            <div className="flex items-center justify-between w-full app-no-drag gap-1">
               <Select
                  value={selectedEnvironmentId ?? ""}
                  onValueChange={handleSelect}
               >
                  <SelectTrigger className="w-full bg-transparent border-transparent shadow-none hover:bg-[#161616] focus:ring-0 px-2 h-10 transition-colors truncate">
                     <div className="flex items-center gap-2.5 truncate">
                        <div className="h-6 w-6 rounded bg-[#222] border border-[#333] flex items-center justify-center text-accent shrink-0">
                           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                        </div>
                        <SelectValue placeholder="Select Database" />
                     </div>
                  </SelectTrigger>
                  <SelectContent className="border-[#333] min-w-[200px]">
                     {environments.map((env: Environment) => (
                        <SelectItem key={env.id} value={env.id}>
                           {env.name || `${env.dbType} ${env.port}`}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
               
               <div className="flex items-center shrink-0">
                  <button onClick={onSettingsOpen} className="h-7 w-7 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-[#161616] transition-colors" aria-label="Settings">
                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><circle cx="12" cy="12" r="10"/><path d="m11.5 15.5 3-3-3-3"/><path d="M7.5 15.5 11 12l-3.5-3.5"/></svg>
                  </button>
                  <button onClick={onClose} className="h-7 w-7 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-[#161616] transition-colors" aria-label="Collapse sidebar">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
               </div>
            </div>
         }
      />
   )
}
