import { describe, it, expect, beforeEach } from "vitest"
import { useSettingsStore } from "./settingsStore"

describe("settingsStore", () => {
   beforeEach(() => {
      useSettingsStore.setState({
         vimModeEnabled: false,
         keybindings: [],
         theme: "dark",
         autoSave: true,
      })
   })

   it("should have initial state", () => {
      const state = useSettingsStore.getState()
      expect(state.vimModeEnabled).toBe(false)
      expect(state.theme).toBe("dark")
      expect(state.autoSave).toBe(true)
   })

   it("toggleVimMode should toggle vim mode", () => {
      const result = useSettingsStore.getState().toggleVimMode()
      expect(result.isOk()).toBe(true)
      expect(useSettingsStore.getState().vimModeEnabled).toBe(true)

      useSettingsStore.getState().toggleVimMode()
      expect(useSettingsStore.getState().vimModeEnabled).toBe(false)
   })

   it("setVimModeEnabled should set vim mode", () => {
      useSettingsStore.getState().setVimModeEnabled(true)
      expect(useSettingsStore.getState().vimModeEnabled).toBe(true)

      useSettingsStore.getState().setVimModeEnabled(false)
      expect(useSettingsStore.getState().vimModeEnabled).toBe(false)
   })

   it("setTheme should only accept dark theme", () => {
      const result = useSettingsStore.getState().setTheme("dark")
      expect(result.isOk()).toBe(true)
   })

   it("setAutoSave should set auto save", () => {
      useSettingsStore.getState().setAutoSave(false)
      expect(useSettingsStore.getState().autoSave).toBe(false)
   })

   describe("keybindings", () => {
      it("addKeybinding should add a keybinding", () => {
         const binding = {
            action: "query.execute",
            key: "r",
            ctrl: true,
            shift: false,
            alt: false,
            meta: false,
         }
         useSettingsStore.getState().addKeybinding(binding)
         expect(useSettingsStore.getState().keybindings).toHaveLength(1)
         expect(useSettingsStore.getState().keybindings[0].action).toBe("query.execute")
      })

      it("updateKeybinding should update a keybinding at index", () => {
         useSettingsStore
            .getState()
            .addKeybinding({
               action: "query.execute",
               key: "r",
               ctrl: true,
               shift: false,
               alt: false,
               meta: false,
            })
         const newBinding = {
            action: "env.create",
            key: "n",
            ctrl: true,
            shift: false,
            alt: false,
            meta: false,
         }
         const result = useSettingsStore.getState().updateKeybinding(0, newBinding)
         expect(result.isOk()).toBe(true)
         expect(useSettingsStore.getState().keybindings[0].action).toBe("env.create")
      })

      it("updateKeybinding should return error for invalid index", () => {
         const result = useSettingsStore
            .getState()
            .updateKeybinding(99, {
               action: "query.execute",
               key: "x",
               ctrl: false,
               shift: false,
               alt: false,
               meta: false,
            })
         expect(result.isErr()).toBe(true)
      })

      it("removeKeybinding should remove a keybinding at index", () => {
         useSettingsStore
            .getState()
            .addKeybinding({
               action: "query.execute",
               key: "r",
               ctrl: true,
               shift: false,
               alt: false,
               meta: false,
            })
         useSettingsStore
            .getState()
            .addKeybinding({
               action: "env.create",
               key: "n",
               ctrl: true,
               shift: false,
               alt: false,
               meta: false,
            })
         const result = useSettingsStore.getState().removeKeybinding(0)
         expect(result.isOk()).toBe(true)
         expect(useSettingsStore.getState().keybindings).toHaveLength(1)
         expect(useSettingsStore.getState().keybindings[0].action).toBe("env.create")
      })

      it("removeKeybinding should return error for invalid index", () => {
         const result = useSettingsStore.getState().removeKeybinding(99)
         expect(result.isErr()).toBe(true)
      })

      it("resetKeybindings should reset to defaults", () => {
         useSettingsStore
            .getState()
            .addKeybinding({
               action: "query.execute",
               key: "r",
               ctrl: true,
               shift: false,
               alt: false,
               meta: false,
            })
         const result = useSettingsStore.getState().resetKeybindings()
         expect(result.isOk()).toBe(true)
      })
   })
})
