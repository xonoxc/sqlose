import { useCallback } from "react"
import { useSettingsStore } from "../stores/settingsStore"
import { useEditorStore } from "../stores/editorStore"

export function useSettingsPanelState() {
   const vimModeEnabled = useSettingsStore(s => s.vimModeEnabled)
   const toggleVimMode = useSettingsStore(s => s.toggleVimMode)
   const keybindings = useSettingsStore(s => s.keybindings)
   const resetKeybindings = useSettingsStore(s => s.resetKeybindings)
   const setVimEnabled = useEditorStore(s => s.setVimEnabled)

   const handleToggleVim = useCallback(() => {
      const next = !vimModeEnabled
      toggleVimMode()
      setVimEnabled(next)
   }, [vimModeEnabled, toggleVimMode, setVimEnabled])

   const handleResetKeybindings = useCallback(() => {
      resetKeybindings()
   }, [resetKeybindings])

   return {
      vimModeEnabled,
      handleToggleVim,
      keybindings,
      handleResetKeybindings,
   }
}
