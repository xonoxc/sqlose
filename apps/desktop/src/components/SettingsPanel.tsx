import {
   Modal,
   ModalPortal,
   ModalOverlay,
   ModalContent,
   ModalHeader,
   ModalFooter,
   ModalTitle,
   ModalDescription,
   Button,
   Separator,
} from "@sqlose/ui"
import { IconRotate, IconToggleLeft, IconToggleRight } from "@tabler/icons-react"
import { useSettingsPanelState } from "../hooks/useSettingsPanelState"

interface SettingsPanelProps {
   isOpen: boolean
   onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
   const { vimModeEnabled, handleToggleVim, keybindings, handleResetKeybindings } =
      useSettingsPanelState()

   const actionLabels: Record<string, string> = {
      "query.execute": "Execute Query",
      "palette.open": "Open Command Palette",
      "tab.new": "New Tab",
      "tab.close": "Close Tab",
      "tab.next": "Next Tab",
      "tab.prev": "Previous Tab",
   }

   const formatKeybinding = (kb: {
      key: string
      ctrl: boolean
      shift: boolean
      alt: boolean
      meta: boolean
   }) => {
      const parts: string[] = []
      if (kb.ctrl) parts.push("Ctrl")
      if (kb.alt) parts.push("Alt")
      if (kb.shift) parts.push("Shift")
      if (kb.meta) parts.push("⌘")
      parts.push(kb.key.charAt(0).toUpperCase() + kb.key.slice(1))
      return parts.join(" + ")
   }

   return (
      <Modal open={isOpen} onOpenChange={onClose}>
         {isOpen && (
            <ModalPortal>
               <ModalOverlay />
               <ModalContent className="max-w-lg">
                  <ModalHeader>
                     <ModalTitle>Settings</ModalTitle>
                     <ModalDescription>Configure your SQLLab preferences</ModalDescription>
                  </ModalHeader>

                  <div className="px-6 py-4 space-y-6">
                     <section>
                        <h3 className="text-sm font-medium text-text-primary mb-3">Editor</h3>
                        <div className="flex items-center justify-between">
                           <div>
                              <p className="text-sm text-text-primary">Vim Mode</p>
                              <p className="text-xs text-text-muted mt-0.5">
                                 Enable Vim keybindings in the SQL editor
                              </p>
                           </div>
                           <button
                              onClick={handleToggleVim}
                              className="text-text-primary hover:text-accent transition-colors"
                              aria-label="Toggle Vim mode"
                           >
                              {vimModeEnabled ? (
                                 <IconToggleRight className="h-6 w-6 text-accent" />
                              ) : (
                                 <IconToggleLeft className="h-6 w-6 text-text-muted" />
                              )}
                           </button>
                        </div>
                     </section>

                     <Separator />

                     <section>
                        <div className="flex items-center justify-between mb-3">
                           <h3 className="text-sm font-medium text-text-primary">Keybindings</h3>
                           <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleResetKeybindings}
                              className="h-6 text-xs gap-1"
                           >
                              <IconRotate className="h-3 w-3" />
                              Reset
                           </Button>
                        </div>
                        <div className="space-y-1">
                           {keybindings.map((kb, index) => (
                              <div
                                 key={index}
                                 className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-bg-quaternary"
                              >
                                 <span className="text-xs text-text-primary">
                                    {actionLabels[kb.action] || kb.action}
                                 </span>
                                 <kbd className="text-[10px] font-mono text-text-muted bg-bg-tertiary border border-border rounded px-1.5 py-0.5">
                                    {formatKeybinding(kb)}
                                 </kbd>
                              </div>
                           ))}
                        </div>
                     </section>
                  </div>

                  <ModalFooter>
                     <Button variant="default" size="sm" onClick={onClose}>
                        Done
                     </Button>
                  </ModalFooter>
               </ModalContent>
            </ModalPortal>
         )}
      </Modal>
   )
}
