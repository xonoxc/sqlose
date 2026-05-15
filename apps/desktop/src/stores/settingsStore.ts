import { create } from "zustand"
import { persist } from "zustand/middleware"
import { ok, err, type Result } from "neverthrow"
import { AppError } from "@sqlose/shared"
import type { Keybinding } from "../lib/types"
import { createDefaultKeybindings } from "../lib/types"

interface SettingsStore {
   vimModeEnabled: boolean
   keybindings: Keybinding[]
   theme: "dark"
   autoSave: boolean

   toggleVimMode: () => Result<boolean, AppError>
   setVimModeEnabled: (enabled: boolean) => Result<boolean, AppError>
   setTheme: (theme: "dark") => Result<"dark", AppError>
   setAutoSave: (enabled: boolean) => Result<boolean, AppError>
   updateKeybinding: (index: number, binding: Keybinding) => Result<Keybinding, AppError>
   addKeybinding: (binding: Keybinding) => Result<Keybinding, AppError>
   removeKeybinding: (index: number) => Result<number, AppError>
   resetKeybindings: () => Result<Keybinding[], AppError>
}

export const useSettingsStore = create<SettingsStore>()(
   persist(
      (set, get) => ({
         vimModeEnabled: false,
         keybindings: createDefaultKeybindings(),
         theme: "dark",
         autoSave: true,

         toggleVimMode: () => {
            const current = get().vimModeEnabled
            const newValue = !current
            set({ vimModeEnabled: newValue })
            return ok(newValue)
         },

         setVimModeEnabled: (enabled: boolean) => {
            set({ vimModeEnabled: enabled })
            return ok(enabled)
         },

         setTheme: (theme: "dark") => {
            if (theme !== "dark") {
               return err(new AppError("ipc:invalid_payload", `Invalid theme: ${theme}`))
            }
            set({ theme })
            return ok(theme)
         },

         setAutoSave: (enabled: boolean) => {
            set({ autoSave: enabled })
            return ok(enabled)
         },

         updateKeybinding: (index: number, binding: Keybinding) => {
            const current = get().keybindings
            if (index < 0 || index >= current.length) {
               return err(new AppError("ipc:invalid_payload", `Invalid keybinding index: ${index}`))
            }
            const newBindings = [...current]
            newBindings[index] = binding
            set({ keybindings: newBindings })
            return ok(binding)
         },

         addKeybinding: (binding: Keybinding) => {
            const current = get().keybindings
            const newBindings = [...current, binding]
            set({ keybindings: newBindings })
            return ok(binding)
         },

         removeKeybinding: (index: number) => {
            const current = get().keybindings
            if (index < 0 || index >= current.length) {
               return err(new AppError("ipc:invalid_payload", `Invalid keybinding index: ${index}`))
            }
            const newBindings = current.filter((_, i) => i !== index)
            set({ keybindings: newBindings })
            return ok(index)
         },

         resetKeybindings: () => {
            const defaults = createDefaultKeybindings()
            set({ keybindings: defaults })
            return ok(defaults)
         },
      }),
      {
         name: "sqlose-settings",
      }
   )
)
