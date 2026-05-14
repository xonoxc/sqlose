import { useRef, useCallback, useEffect, lazy, Suspense, useState } from "react"
import type { editor } from "monaco-editor"
import { cn } from "@sqlose/ui"
import { IconPlayerPlay, IconSettings, IconDeviceFloppy } from "@tabler/icons-react"
import { useEnvironmentStore } from "../stores/environmentStore"
import { useSettingsStore } from "../stores/settingsStore"
import { useEditorStore } from "../stores/editorStore"
import { useSavedQueriesStore } from "../stores/savedQueriesStore"
import { isMac } from "../lib/types"
import type { VimMode } from "../lib/types"

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

function parseVimMode(text: string): VimMode | null {
   const upper = text.toUpperCase().trim()
   if (upper.includes("INSERT")) return "insert"
   if (upper.includes("VISUAL BLOCK")) return "visual-block"
   if (upper.includes("VISUAL LINE")) return "visual-line"
   if (upper.includes("VISUAL")) return "visual"
   if (upper.includes("NORMAL")) return "normal"
   return null
}

export function SQLEditor({ value, onChange, onExecute, onSettingsOpen, onCommandMode, isExecuting, executionTimeMs }: SQLEditorProps) {
   const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
   const vimModeRef = useRef<{ dispose: () => void } | null>(null)
   const vimObserverRef = useRef<MutationObserver | null>(null)
   const vimStatusRef = useRef<HTMLDivElement>(null)
   const [saveDialogOpen, setSaveDialogOpen] = useState(false)
   const [saveName, setSaveName] = useState("")

   const vimEnabled = useSettingsStore((s) => s.vimModeEnabled)
   const selectedEnvironmentId = useEnvironmentStore((s) => s.selectedEnvironmentId)
   const saveQuery = useSavedQueriesStore((s) => s.saveQuery)

   function setupVimObserver() {
      if (!vimStatusRef.current) return
      vimObserverRef.current?.disconnect()
      const observer = new MutationObserver(() => {
         const text = vimStatusRef.current?.textContent?.trim() ?? ""
         const mode = parseVimMode(text)
         if (mode) {
            useEditorStore.getState().setVimMode(mode)
         }
      })
      observer.observe(vimStatusRef.current, { characterData: true, childList: true, subtree: true })
      vimObserverRef.current = observer
      const initialText = vimStatusRef.current.textContent?.trim() ?? ""
      const initialMode = parseVimMode(initialText)
      if (initialMode) {
         useEditorStore.getState().setVimMode(initialMode)
      }
   }

   const handleEditorMount = useCallback(
      async (monacoEditor: editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
         editorRef.current = monacoEditor

          monaco.editor.defineTheme("sqlose-dark", {
             base: "vs-dark",
             inherit: true,
             rules: [
                { token: "keyword", foreground: "7ec8e3", fontStyle: "bold" },
                { token: "identifier", foreground: "f0f0f0" },
                { token: "string", foreground: "d4a87c" },
                { token: "number", foreground: "b5cea8" },
                { token: "comment", foreground: "6a6a6a", fontStyle: "italic" },
                { token: "operator", foreground: "a0a0a0" },
                { token: "delimiter", foreground: "a0a0a0" },
                { token: "type", foreground: "4ec9b0" }
             ],
             colors: {
                "editor.background": "#0a0a0a",
                "editor.foreground": "#f0f0f0",
                "editorLineNumber.foreground": "#3a3a3a",
                "editorLineNumber.activeForeground": "#8a8a8a",
                "editor.selectionBackground": "#2a5f7a",
                "editor.inactiveSelectionBackground": "#3a3d41",
                "editorCursor.foreground": "#f0f0f0",
                "editorIndentGuide.background": "#1a1a1a",
                "editorIndentGuide.activeBackground": "#3a3a3a",
                "editor.lineHighlightBackground": "#111111",
                "editorWidget.background": "#141414",
                "editorWidget.border": "#232323",
                "editorBracketMatch.background": "#2a5f7a40",
                "editorBracketMatch.border": "#2a5f7a"
             }
          })

         monaco.editor.setTheme("sqlose-dark")

         monaco.languages.registerCompletionItemProvider('sql', {
            provideCompletionItems: (model, position) => {
               const word = model.getWordUntilPosition(position)
               const range = {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: word.startColumn,
                  endColumn: word.endColumn,
               }
               const suggestions = [
                  { label: 'SELECT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'SELECT ', range },
                  { label: 'FROM', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'FROM ', range },
                  { label: 'WHERE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'WHERE ', range },
                  { label: 'INSERT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'INSERT INTO ', range },
                  { label: 'UPDATE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'UPDATE ', range },
                  { label: 'DELETE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DELETE FROM ', range },
                  { label: 'JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'JOIN ', range },
                  { label: 'LEFT JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'LEFT JOIN ', range },
                  { label: 'GROUP BY', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'GROUP BY ', range },
                  { label: 'ORDER BY', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ORDER BY ', range },
                  { label: 'LIMIT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'LIMIT ', range },
               ]
               return { suggestions }
            }
         })

          monacoEditor.onKeyDown((e) => {
             if (e.browserEvent.key !== ":") return
             const state = useEditorStore.getState()
             if (state.vimEnabled && state.vimMode === "normal") {
                e.preventDefault()
                e.stopPropagation()
                onCommandMode?.()
             }
          })

          if (vimEnabled && vimStatusRef.current) {
             const { initVimMode } = await import("monaco-vim")
             vimModeRef.current = initVimMode(monacoEditor, vimStatusRef.current)
             setupVimObserver()
             monacoEditor.onDidChangeModelContent(() => {
                onChange(monacoEditor.getValue())
             })
           }
        },
        [vimEnabled, onChange, onCommandMode],
    )

    const handleChange = useCallback(
      (newValue: string | undefined) => {
         if (newValue !== undefined && !vimEnabled) {
            onChange(newValue)
         }
      },
      [vimEnabled, onChange],
   )

   useEffect(() => {
      if (editorRef.current) {
         vimObserverRef.current?.disconnect()
         vimObserverRef.current = null
         vimModeRef.current?.dispose()
         vimModeRef.current = null

         if (vimEnabled && vimStatusRef.current) {
            import("monaco-vim").then(({ initVimMode }) => {
               vimModeRef.current = initVimMode(editorRef.current!, vimStatusRef.current!)
               setupVimObserver()
               editorRef.current!.onDidChangeModelContent(() => {
                  onChange(editorRef.current!.getValue())
               })
            })
         }
      }
   }, [vimEnabled, onChange])

   useEffect(() => {
      return () => {
         vimObserverRef.current?.disconnect()
         vimModeRef.current?.dispose()
      }
   }, [])

   return (
      <div className="flex flex-col h-full bg-bg-primary w-full">
         <div className="flex items-center justify-between h-10 px-4 border-b border-border/80 bg-bg-secondary shrink-0 select-none">
            <div className="flex items-center gap-3">
               <button
                  onClick={onExecute}
                  disabled={isExecuting || !selectedEnvironmentId || !value.trim()}
                  className={cn(
                     "flex items-center gap-1.5 h-7 px-3 rounded-md text-[12px] font-semibold transition-all outline-none",
                     (isExecuting || !selectedEnvironmentId || !value.trim())
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
                            <span className="text-[9px] font-sans font-medium">{isMac() ? "⌘" : "Ctrl"}</span>
                            {!isMac() && <span className="text-[9px] font-sans font-medium">+</span>}
                            <span className="text-[9px] font-sans font-medium">↵</span>
                         </div>
                     </>
                  )}
               </button>

               {executionTimeMs !== null && !isExecuting && (
                  <span className="text-[10px] text-text-muted font-mono">
                     {executionTimeMs}ms
                  </span>
               )}

               <div className="flex items-center gap-1 ml-2 border-l border-[#222] pl-3">
                <div className="relative">
                     <button
                        onClick={() => { setSaveName(""); setSaveDialogOpen(!saveDialogOpen) }}
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
                              onChange={(e) => setSaveName(e.target.value)}
                              onKeyDown={(e) => {
                                 if (e.key === "Enter" && saveName.trim()) {
                                    saveQuery(saveName.trim(), value, [], selectedEnvironmentId)
                                    setSaveDialogOpen(false)
                                    setSaveName("")
                                 }
                                 if (e.key === "Escape") {
                                    setSaveDialogOpen(false)
                                    setSaveName("")
                                 }
                              }}
                              placeholder="Query name..."
                              className="bg-bg-tertiary text-[11px] text-text-primary px-2 py-1 rounded border border-border outline-none w-36"
                           />
                           <button
                              onClick={() => {
                                 if (saveName.trim()) {
                                    saveQuery(saveName.trim(), value, [], selectedEnvironmentId)
                                    setSaveDialogOpen(false)
                                    setSaveName("")
                                 }
                              }}
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
            <Suspense fallback={
               <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  Loading editor...
               </div>
            }>
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
                      scrollbar: { vertical: "hidden", horizontal: "hidden", verticalScrollbarSize: 0, horizontalScrollbarSize: 0, alwaysConsumeMouseWheel: false },
                      cursorBlinking: "solid",
                      cursorSmoothCaretAnimation: "off",
                      smoothScrolling: false,
                     renderLineHighlight: "line",
                     fontLigatures: true,
                     matchBrackets: "near",
                     bracketPairColorization: { enabled: true }
                  }}
               />
            </Suspense>
            {vimEnabled && <div ref={vimStatusRef} className="h-5 text-[10px] bg-bg-tertiary border-t border-border flex items-center px-2 text-text-muted font-mono shrink-0" />}
         </div>
      </div>
   )
}
