import type { QueryResult } from "@sqlose/shared"

export type TabType = "query" | "import" | "dataset"

export interface Tab {
   id: string
   type: TabType
   title: string
   environmentId: string | null
   isDirty: boolean
   isExecuting: boolean
   query: string
   result: QueryResult | null
   error: string | null
   createdAt: string
   tableName?: string
}

export interface PaneSizes {
   sidebarWidth: number
   editorHeight: number
   resultsHeight: number
}

export type VimMode = "normal" | "insert" | "visual" | "visual-line" | "visual-block"

export interface Keybinding {
   action: string
   key: string
   ctrl: boolean
   shift: boolean
   alt: boolean
   meta: boolean
}

export interface SavedQuery {
   id: string
   name: string
   sql: string
   tags: string[]
   environmentId: string | null
   createdAt: string
   updatedAt: string
}

export interface HistoryEntry {
   id: string
   sql: string
   environmentId: string | null
   dbType: string
   duration: number
   rowCount: number
   status: "success" | "error"
   error: string | null
   executedAt: string
}

function extractTableName(sql: string): string {
   const cleaned = sql.trim().replace(/\s+/g, " ")
   const upper = cleaned.toUpperCase()

   if (upper.startsWith("SELECT")) {
      const fromMatch = cleaned.match(/\bFROM\s+[`"']?(\w+)[`"']?/i)
      if (fromMatch) return `SELECT * FROM ${fromMatch[1]}`
      const selectMatch = cleaned.match(/SELECT\s+(.*?)\s+FROM/i)
      if (selectMatch) {
         const cols =
            selectMatch[1].length > 20 ? selectMatch[1].slice(0, 20) + "..." : selectMatch[1]
         return `SELECT ${cols}...`
      }
      return "SELECT..."
   }
   if (upper.startsWith("INSERT")) return "INSERT"
   if (upper.startsWith("UPDATE")) {
      const tableMatch = cleaned.match(/UPDATE\s+[`"']?(\w+)[`"']?/i)
      return tableMatch ? `UPDATE ${tableMatch[1]}` : "UPDATE"
   }
   if (upper.startsWith("DELETE")) {
      const tableMatch = cleaned.match(/DELETE\s+FROM\s+[`"']?(\w+)[`"']?/i)
      return tableMatch ? `DELETE FROM ${tableMatch[1]}` : "DELETE"
   }
   if (upper.startsWith("CREATE")) return "CREATE"
   if (upper.startsWith("ALTER")) return "ALTER"
   if (upper.startsWith("DROP")) return "DROP"
   if (upper.startsWith("WITH")) return "CTE Query"
   if (upper.startsWith("EXPLAIN")) return "EXPLAIN"
   if (upper.startsWith("--") || upper.startsWith("/*")) return "Comment"

   return cleaned.length > 32 ? cleaned.slice(0, 32) + "..." : cleaned
}

export function generateTabTitle(query: string): string {
   if (!query || !query.trim()) return "New Query"
   return extractTableName(query)
}

export function createTab(environmentId: string | null = null, tableName?: string): Tab {
   const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
   return {
      id,
      type: "query",
      title: tableName ?? "New Query",
      environmentId,
      isDirty: false,
      isExecuting: false,
      query: tableName ? `SELECT * FROM ${tableName} LIMIT 100` : "",
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      tableName,
   }
}

export function createSavedQuery(
   name: string,
   sql: string,
   tags: string[] = [],
   environmentId: string | null = null
): SavedQuery {
   const id = `sq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
   const now = new Date().toISOString()
   return { id, name, sql, tags, environmentId, createdAt: now, updatedAt: now }
}

export function createHistoryEntry(
   sql: string,
   environmentId: string | null,
   dbType: string,
   duration: number,
   rowCount: number,
   status: "success" | "error",
   error: string | null
): HistoryEntry {
   return {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      sql,
      environmentId,
      dbType,
      duration,
      rowCount,
      status,
      error,
      executedAt: new Date().toISOString(),
   }
}

export function createDefaultPaneSizes(): PaneSizes {
   return {
      sidebarWidth: 280,
      editorHeight: 300,
      resultsHeight: 300,
   }
}

export function isMac(): boolean {
   return navigator.platform.toLowerCase().includes("mac")
}

export function formatShortcut(mod: boolean, shift: boolean, alt: boolean, key: string): string {
   const parts: string[] = []
   if (mod) parts.push(isMac() ? "⌘" : "Ctrl")
   if (shift) parts.push("⇧")
   if (alt) parts.push(isMac() ? "⌥" : "Alt")
   if (key === "Enter") parts.push("↵")
   else if (key === "Tab") parts.push("⇥")
   else if (key === " ") parts.push("Space")
   else parts.push(key.toUpperCase())
   return parts.join(isMac() ? "" : "+")
}

export function createDefaultKeybindings(): Keybinding[] {
   return [
      { action: "query.execute", key: "Enter", ctrl: false, shift: false, alt: false, meta: true },
      { action: "query.execute", key: "Enter", ctrl: true, shift: false, alt: false, meta: false },
      { action: "palette.open", key: "k", ctrl: false, shift: false, alt: false, meta: true },
      { action: "palette.open", key: "p", ctrl: true, shift: true, alt: false, meta: false },
      { action: "tab.new", key: "t", ctrl: false, shift: false, alt: false, meta: true },
      { action: "tab.close", key: "w", ctrl: false, shift: false, alt: false, meta: true },
      { action: "tab.next", key: "Tab", ctrl: false, shift: false, alt: false, meta: true },
      { action: "tab.prev", key: "Tab", ctrl: false, shift: true, alt: false, meta: true },
   ]
}
