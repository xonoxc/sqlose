import { useRef, useCallback, useEffect, lazy, Suspense } from "react"
import type { editor } from "monaco-editor"
import { motion } from "motion/react"
import { cn } from "@sqlose/ui"
import { IconPlayerPlay, IconSettings } from "@tabler/icons-react"
import { useEditorStore } from "../stores/editorStore"
import { useEnvironmentStore } from "../stores/environmentStore"
import { useSettingsStore } from "../stores/settingsStore"

const Editor = lazy(() => import("@monaco-editor/react"))

interface SQLEditorProps {
   onExecute: () => void
   onSettingsOpen: () => void
   isExecuting: boolean
   executionTimeMs: number | null
}

export function SQLEditor({ onExecute, onSettingsOpen, isExecuting, executionTimeMs }: SQLEditorProps) {
   const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
   const vimModeRef = useRef<{ dispose: () => void } | null>(null)
   const vimStatusRef = useRef<HTMLDivElement>(null)

   const queryDraft = useEditorStore((s) => s.queryDraft)
   const setQueryDraft = useEditorStore((s) => s.setQueryDraft)
   const vimMode = useEditorStore((s) => s.vimMode)

   const vimEnabled = useSettingsStore((s) => s.vimModeEnabled)
   const selectedEnvironmentId = useEditorStore((s) => s.selectedEnvironmentId)
   const getEnvironment = useEnvironmentStore((s) => s.getEnvironment)

   const selectedEnv = selectedEnvironmentId ? getEnvironment(selectedEnvironmentId) : null

   const handleEditorMount = useCallback(
      async (editor: editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
         editorRef.current = editor

         // Define custom premium dark theme
         monaco.editor.defineTheme("sqlose-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
               { token: "keyword", foreground: "479e8d", fontStyle: "bold" },
               { token: "identifier", foreground: "eeeeee" },
               { token: "string", foreground: "c28938" },
               { token: "number", foreground: "57b09f" },
               { token: "comment", foreground: "656565", fontStyle: "italic" },
               { token: "operator", foreground: "909090" },
               { token: "delimiter", foreground: "909090" },
               { token: "type", foreground: "378b7b" }
            ],
            colors: {
               "editor.background": "#0e0e0e",
               "editor.foreground": "#eeeeee",
               "editorLineNumber.foreground": "#444444",
               "editorLineNumber.activeForeground": "#909090",
               "editor.selectionBackground": "#283b38",
               "editor.inactiveSelectionBackground": "#1e2826",
               "editorCursor.foreground": "#57b09f",
               "editorIndentGuide.background": "#232323",
               "editorIndentGuide.activeBackground": "#444444",
               "editor.lineHighlightBackground": "#141414",
               "editorWidget.background": "#141414",
               "editorWidget.border": "#232323"
            }
         })

         monaco.editor.setTheme("sqlose-dark")

         if (vimEnabled && vimStatusRef.current) {
            const { initVimMode } = await import("monaco-vim")
            vimModeRef.current = initVimMode(editor, vimStatusRef.current)
            editor.onDidChangeModelContent(() => {
               setQueryDraft(editor.getValue())
            })
         }
      },
      [vimEnabled, setQueryDraft],
   )

   const handleChange = useCallback(
      (value: string | undefined) => {
         if (value !== undefined && !vimEnabled) {
            setQueryDraft(value)
         }
      },
      [vimEnabled, setQueryDraft],
   )

   useEffect(() => {
      if (editorRef.current) {
         if (vimModeRef.current) {
            vimModeRef.current.dispose()
            vimModeRef.current = null
         }

         if (vimEnabled && vimStatusRef.current) {
            import("monaco-vim").then(({ initVimMode }) => {
               vimModeRef.current = initVimMode(editorRef.current!, vimStatusRef.current!)
            })
         }
      }
   }, [vimEnabled])

   useEffect(() => {
      return () => {
         vimModeRef.current?.dispose()
      }
   }, [])

   const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
         if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault()
            onExecute()
         }
      },
      [onExecute],
   )

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="flex flex-col h-full bg-[#111111] w-full"
         onKeyDown={handleKeyDown}
      >
         <div className="flex items-center justify-between h-[46px] px-6 border-b border-[#1e1e1e] bg-[#111111] shrink-0 transition-colors w-full">
            <div className="flex items-center gap-4">
               <button
                  onClick={onExecute}
                  disabled={isExecuting || !selectedEnvironmentId || !queryDraft.trim()}
                  className={cn(
                     "flex items-center gap-2 h-7 px-3 rounded-md text-[13px] font-semibold transition-all duration-200 outline-none",
                     (isExecuting || !selectedEnvironmentId || !queryDraft.trim())
                        ? "bg-[#2563eb]/40 text-text-primary/50 cursor-not-allowed"
                        : "bg-[#2563eb] hover:bg-[#3b82f6] text-white shadow-sm"
                  )}
               >
                  <IconPlayerPlay className="h-3.5 w-3.5 fill-current" />
                  Run Query
               </button>
               
               {executionTimeMs !== null && (
                  <span className="text-[11px] text-[#909090] font-mono ml-2 border border-[#222] bg-[#161616] px-1.5 py-0.5 rounded">
                     {executionTimeMs}ms
                  </span>
               )}

               <div className="flex items-center gap-1.5 ml-2 border-l border-[#222] pl-4">
                  <button className="h-7 w-7 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-[#222] transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  </button>
                  <button className="h-7 w-7 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-[#222] transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </button>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 bg-[#161616] border border-[#222] px-2 py-1 rounded-md" aria-label="Settings">
                  <span className="text-[12px] text-text-muted flex items-center gap-1.5 cursor-pointer hover:text-text-primary" onClick={onSettingsOpen}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><circle cx="12" cy="12" r="10"/><path d="m11.5 15.5 3-3-3-3"/><path d="M7.5 15.5 11 12l-3.5-3.5"/></svg>
                     DB Pro AI
                  </span>
                  <button onClick={onSettingsOpen}><IconSettings className="h-3.5 w-3.5 text-text-muted hover:text-text-primary" /></button>
               </div>
               
               <span className="text-[12px] font-semibold text-text-muted bg-[#161616] border border-[#222] px-3 py-1 rounded-md uppercase min-w-16 text-center">
                  {selectedEnv?.dbType ?? "SQL"}
               </span>
            </div>
         </div>
         <div className="flex-1 relative pt-4">
            <Suspense fallback={
               <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  Loading editor...
               </div>
            }>
               <Editor
                  height="100%"
                  defaultLanguage="sql"
                  value={queryDraft}
                  onChange={handleChange}
                  onMount={handleEditorMount}
                  options={{
                     minimap: { enabled: false },
                     fontSize: 14,
                     fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
                     lineHeight: 24,
                     lineNumbersMinChars: 3,
                     lineNumbers: "on",
                     scrollBeyondLastLine: false,
                     wordWrap: "on",
                     padding: { top: 16, bottom: 16 },
                     suggestOnTriggerCharacters: true,
                     quickSuggestions: true,
                     cursorBlinking: "smooth",
                     cursorSmoothCaretAnimation: "on",
                     smoothScrolling: true,
                     renderLineHighlight: "all",
                     fontLigatures: true,
                     matchBrackets: "near",
                     bracketPairColorization: { enabled: true }
                  }}
               />
            </Suspense>
            <div
               ref={vimStatusRef}
               className={cn(
                  "absolute bottom-0 left-0 z-10 text-[10px] font-mono px-2 py-0.5 rounded-tr",
                  vimEnabled ? "block" : "hidden",
                  (vimMode === "insert" || vimMode === "visual" || vimMode === "visual-line" || vimMode === "visual-block")
                     ? "bg-green-700/50 text-green-300"
                     : vimMode === "normal"
                       ? "bg-bg-quaternary text-text-muted"
                       : "bg-yellow-700/50 text-yellow-300",
               )}
            >
               {vimMode.toUpperCase().replace("-", " ")}
            </div>
         </div>
      </motion.div>
   )
}
