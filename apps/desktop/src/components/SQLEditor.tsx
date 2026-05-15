import { lazy, Suspense } from "react"
import { cn } from "@sqlose/ui"
import { IconPlayerPlay, IconSettings, IconDeviceFloppy } from "@tabler/icons-react"
import { isMac } from "../lib/types"
import { useSQLEditorLogic } from "../hooks/useSQLEditorLogic"

const Editor = lazy(() => import("@monaco-editor/react"))

interface SQLEditorProps {
   value: string
   onChange: (value: string) => void
   onExecute: () => void
   onSettingsOpen: () => void
   onCommandMode?: () => void
   isExecuting: boolean
   executionTimeMs: number | null
}

export function SQLEditor({
   value,
   onChange,
   onExecute,
   onSettingsOpen,
   onCommandMode,
   isExecuting,
   executionTimeMs,
}: SQLEditorProps) {
   const {
      vimStatusRef,
      vimEnabled,
      saveDialogOpen,
      setSaveDialogOpen,
      saveName,
      setSaveName,
      selectedEnvironmentId,
      handleEditorMount,
      handleChange,
      handleSaveSubmit,
   } = useSQLEditorLogic(value, onChange, onCommandMode)

   return (
      <div className="flex flex-col h-full bg-bg-primary w-full">
         <div className="flex items-center justify-between h-10 px-4 border-b border-border/80 bg-bg-secondary shrink-0 select-none">
            <div className="flex items-center gap-3">
               <button
                  onClick={onExecute}
                  disabled={isExecuting || !selectedEnvironmentId || !value.trim()}
                  className={cn(
                     "flex items-center gap-1.5 h-7 px-3 rounded-md text-[12px] font-semibold transition-all outline-none",
                     isExecuting || !selectedEnvironmentId || !value.trim()
                        ? "bg-accent/20 text-white/50 cursor-not-allowed"
                        : "bg-accent hover:bg-accent-light text-white shadow-sm"
                  )}
               >
                  {isExecuting ? (
                     <>
                        <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Running...
                     </>
                  ) : (
                     <>
                        <IconPlayerPlay className="h-3 w-3 fill-current" />
                        Run Query
                        <div className="flex items-center gap-0.5 ml-1 opacity-70 border-l border-white/20 pl-2">
                           <span className="text-[9px] font-sans font-medium">
                              {isMac() ? "⌘" : "Ctrl"}
                           </span>
                           {!isMac() && <span className="text-[9px] font-sans font-medium">+</span>}
                           <span className="text-[9px] font-sans font-medium">↵</span>
                        </div>
                     </>
                  )}
               </button>

               {executionTimeMs !== null && !isExecuting && (
                  <span className="text-[10px] text-text-muted font-mono">{executionTimeMs}ms</span>
               )}

               <div className="flex items-center gap-1 ml-2 border-l border-[#222] pl-3">
                  <div className="relative">
                     <button
                        onClick={() => {
                           setSaveName("")
                           setSaveDialogOpen(!saveDialogOpen)
                        }}
                        className="h-6 w-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-[#222] transition-colors"
                        aria-label="Save query"
                     >
                        <IconDeviceFloppy className="h-3.5 w-3.5" />
                     </button>
                     {saveDialogOpen && (
                        <div className="absolute top-full left-0 mt-1 z-50 flex items-center gap-1 bg-bg-secondary border border-border rounded-md p-1.5 shadow-xl">
                           <input
                              autoFocus
                              type="text"
                              value={saveName}
                              onChange={e => setSaveName(e.target.value)}
                              onKeyDown={e => {
                                 if (e.key === "Enter") handleSaveSubmit()
                                 if (e.key === "Escape") {
                                    setSaveDialogOpen(false)
                                    setSaveName("")
                                 }
                              }}
                              placeholder="Query name..."
                              className="bg-bg-tertiary text-[11px] text-text-primary px-2 py-1 rounded border border-border outline-none w-36"
                           />
                           <button
                              onClick={handleSaveSubmit}
                              className="text-[10px] font-medium text-accent hover:text-accent-light px-1.5 py-1"
                           >
                              Save
                           </button>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-2">
               <button
                  onClick={onSettingsOpen}
                  className="h-6 w-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-quaternary transition-colors"
                  aria-label="Settings"
               >
                  <IconSettings className="h-3.5 w-3.5" />
               </button>
            </div>
         </div>
         <div className="flex-1 relative">
            <Suspense
               fallback={
                  <div className="flex items-center justify-center h-full text-sm text-text-muted">
                     Loading editor...
                  </div>
               }
            >
               <Editor
                  height="100%"
                  defaultLanguage="sql"
                  value={value}
                  onChange={handleChange}
                  onMount={handleEditorMount}
                  options={{
                     minimap: { enabled: false },
                     fontSize: 14,
                     fontFamily: "'Geist Mono', ui-monospace, monospace",
                     lineHeight: 20,
                     lineNumbersMinChars: 2,
                     lineNumbers: "on",
                     scrollBeyondLastLine: false,
                     wordWrap: "on",
                     padding: { top: 12, bottom: 12 },
                     suggestOnTriggerCharacters: true,
                     quickSuggestions: true,
                     scrollbar: {
                        vertical: "hidden",
                        horizontal: "hidden",
                        verticalScrollbarSize: 0,
                        horizontalScrollbarSize: 0,
                        alwaysConsumeMouseWheel: false,
                     },
                     cursorBlinking: "solid",
                     cursorSmoothCaretAnimation: "off",
                     smoothScrolling: false,
                     renderLineHighlight: "line",
                     fontLigatures: true,
                     matchBrackets: "near",
                     bracketPairColorization: { enabled: true },
                  }}
               />
            </Suspense>
            {vimEnabled && (
               <div
                  ref={vimStatusRef}
                  className="h-5 text-[10px] bg-bg-tertiary border-t border-border flex items-center px-2 text-text-muted font-mono shrink-0"
               />
            )}
         </div>
      </div>
   )
}
