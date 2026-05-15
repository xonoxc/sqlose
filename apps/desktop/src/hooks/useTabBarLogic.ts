import { useRef, useCallback } from "react"
import { useWorkspaceStore } from "../stores/workspaceStore"

export function useTabBarLogic() {
   const tabs = useWorkspaceStore(s => s.tabs)
   const activeTabId = useWorkspaceStore(s => s.activeTabId)
   const openTab = useWorkspaceStore(s => s.openTab)
   const closeTab = useWorkspaceStore(s => s.closeTab)
   const setActiveTab = useWorkspaceStore(s => s.setActiveTab)
   const moveTab = useWorkspaceStore(s => s.moveTab)

   const dragItem = useRef<number | null>(null)
   const dragOverItem = useRef<number | null>(null)

   const handleDragStart = useCallback((index: number) => {
      dragItem.current = index
   }, [])

   const handleDragOver = useCallback((index: number) => {
      dragOverItem.current = index
   }, [])

   const handleDragEnd = useCallback(() => {
      if (
         dragItem.current !== null &&
         dragOverItem.current !== null &&
         dragItem.current !== dragOverItem.current
      ) {
         moveTab(dragItem.current, dragOverItem.current)
      }
      dragItem.current = null
      dragOverItem.current = null
   }, [moveTab])

   const handleOpenTab = useCallback(() => {
      openTab()
   }, [openTab])

   const handleCloseTab = useCallback(
      (tabId: string) => {
         closeTab(tabId)
      },
      [closeTab]
   )

   const handleSetActiveTab = useCallback(
      (tabId: string) => {
         setActiveTab(tabId)
      },
      [setActiveTab]
   )

   return {
      tabs,
      activeTabId,
      handleOpenTab,
      handleCloseTab,
      handleSetActiveTab,
      handleDragStart,
      handleDragOver,
      handleDragEnd,
   }
}
