import { useRef, useCallback, useEffect, useState } from "react"
import { useEnvironmentStore } from "../stores/environmentStore"
import { useSettingsStore } from "../stores/settingsStore"
import { useEditorStore } from "../stores/editorStore"
import { useSavedQueriesStore } from "../stores/savedQueriesStore"
import type { VimMode } from "../lib/types"
import type { editor } from "monaco-editor"

function parseVimMode(text: string): VimMode | null {
   const upper = text.toUpperCase().trim()
   if (upper.includes("INSERT")) return "insert"
   if (upper.includes("VISUAL BLOCK")) return "visual-block"
   if (upper.includes("VISUAL LINE")) return "visual-line"
   if (upper.includes("VISUAL")) return "visual"
   if (upper.includes("NORMAL")) return "normal"
   return null
}

export function useSQLEditorLogic(
   value: string,
   onChange: (value: string) => void,
   onCommandMode?: () => void
) {
   const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
   const vimModeRef = useRef<{ dispose: () => void } | null>(null)
   const vimObserverRef = useRef<MutationObserver | null>(null)
   const vimStatusRef = useRef<HTMLDivElement>(null)
   const [saveDialogOpen, setSaveDialogOpen] = useState(false)
   const [saveName, setSaveName] = useState("")

   const vimEnabled = useSettingsStore(s => s.vimModeEnabled)
   const selectedEnvironmentId = useEnvironmentStore(s => s.selectedEnvironmentId)
   const saveQuery = useSavedQueriesStore(s => s.saveQuery)

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
      observer.observe(vimStatusRef.current, {
         characterData: true,
         childList: true,
         subtree: true,
      })
      vimObserverRef.current = observer
      const initialText = vimStatusRef.current.textContent?.trim() ?? ""
      const initialMode = parseVimMode(initialText)
      if (initialMode) {
         useEditorStore.getState().setVimMode(initialMode)
      }
   }

   const handleEditorMount = useCallback(
      async (
         monacoEditor: editor.IStandaloneCodeEditor,
         monaco: typeof import("monaco-editor")
      ) => {
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
               { token: "type", foreground: "4ec9b0" },
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
               "editorBracketMatch.border": "#2a5f7a",
            },
         })

         monaco.editor.setTheme("sqlose-dark")

         monaco.languages.registerCompletionItemProvider("sql", {
            provideCompletionItems: (model, position) => {
               const word = model.getWordUntilPosition(position)
               const range = {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: word.startColumn,
                  endColumn: word.endColumn,
               }
               const suggestions = [
                  {
                     label: "SELECT",
                     kind: monaco.languages.CompletionItemKind.Keyword,
                     insertText: "SELECT ",
                     range,
                  },
                  {
                     label: "FROM",
                     kind: monaco.languages.CompletionItemKind.Keyword,
                     insertText: "FROM ",
                     range,
                  },
                  {
                     label: "WHERE",
                     kind: monaco.languages.CompletionItemKind.Keyword,
                     insertText: "WHERE ",
                     range,
                  },
                  {
                     label: "INSERT",
                     kind: monaco.languages.CompletionItemKind.Keyword,
                     insertText: "INSERT INTO ",
                     range,
                  },
                  {
                     label: "UPDATE",
                     kind: monaco.languages.CompletionItemKind.Keyword,
                     insertText: "UPDATE ",
                     range,
                  },
                  {
                     label: "DELETE",
                     kind: monaco.languages.CompletionItemKind.Keyword,
                     insertText: "DELETE FROM ",
                     range,
                  },
                  {
                     label: "JOIN",
                     kind: monaco.languages.CompletionItemKind.Keyword,
                     insertText: "JOIN ",
                     range,
                  },
                  {
                     label: "LEFT JOIN",
                     kind: monaco.languages.CompletionItemKind.Keyword,
                     insertText: "LEFT JOIN ",
                     range,
                  },
                  {
                     label: "GROUP BY",
                     kind: monaco.languages.CompletionItemKind.Keyword,
                     insertText: "GROUP BY ",
                     range,
                  },
                  {
                     label: "ORDER BY",
                     kind: monaco.languages.CompletionItemKind.Keyword,
                     insertText: "ORDER BY ",
                     range,
                  },
                  {
                     label: "LIMIT",
                     kind: monaco.languages.CompletionItemKind.Keyword,
                     insertText: "LIMIT ",
                     range,
                  },
               ]
               return { suggestions }
            },
         })

         monacoEditor.onKeyDown(e => {
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
      [vimEnabled, onChange, onCommandMode]
   )

   const handleChange = useCallback(
      (newValue: string | undefined) => {
         if (newValue !== undefined && !vimEnabled) {
            onChange(newValue)
         }
      },
      [vimEnabled, onChange]
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

   const handleSaveSubmit = useCallback(() => {
      if (saveName.trim()) {
         saveQuery(saveName.trim(), value, [], selectedEnvironmentId)
         setSaveDialogOpen(false)
         setSaveName("")
      }
   }, [saveName, value, selectedEnvironmentId, saveQuery])

   return {
      editorRef,
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
   }
}
