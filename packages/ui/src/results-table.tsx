import { useMemo, useState, useRef, useCallback, useEffect } from "react"
import {
   useReactTable,
   getCoreRowModel,
   getSortedRowModel,
   flexRender,
   type SortingState,
   type ColumnDef,
   type Row,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { cn } from "./cn"
import {
   IconArrowUp,
   IconArrowDown,
   IconCopy,
   IconHash,
   IconTypography,
   IconBinary,
   IconChevronDown,
   IconCalendar,
   IconClock,
} from "@tabler/icons-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./table"

type ColumnType = "int" | "float" | "bool" | "uuid" | "date" | "timestamp" | "text"

interface ResultsTableProps<T extends Record<string, unknown>> {
   data: T[]
   rowHeight?: number
   className?: string
   emptyMessage?: string
}

interface ContextMenuState {
   visible: boolean
   x: number
   y: number
   type: "cell" | "row" | "header"
   value?: string
   rowIndex?: number
   columnName?: string
}

function detectColumnType(values: unknown[]): ColumnType {
   for (const v of values) {
      if (v == null) continue
      if (typeof v === "boolean") return "bool"
      if (typeof v === "number") return Number.isInteger(v) ? "int" : "float"
      if (typeof v === "string") {
         if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))
            return "uuid"
         if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return "date"
         if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(v)) return "timestamp"
      }
   }
   return "text"
}

function getColumnWeight(type: ColumnType): number {
   switch (type) {
      case "int":
         return 1
      case "bool":
         return 1
      case "float":
         return 1.5
      case "date":
         return 2
      case "timestamp":
         return 2.5
      case "uuid":
         return 3
      case "text":
         return 5
   }
}

function ColumnTypeIcon({ type }: { type: ColumnType }) {
   const cls = "h-3 w-3 text-text-muted/50 shrink-0"
   switch (type) {
      case "int":
         return <IconHash className={cls} />
      case "float":
         return <IconBinary className={cls} />
      case "bool":
         return <IconBinary className={cls} />
      case "date":
         return <IconCalendar className={cls} />
      case "timestamp":
         return <IconClock className={cls} />
      case "uuid":
         return <IconTypography className={cls} />
      case "text":
         return <IconTypography className={cls} />
   }
}

async function copyToClipboard(text: string) {
   try {
      await navigator.clipboard.writeText(text)
   } catch {
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
   }
}

function formatRow(row: Record<string, unknown>, columns: string[]): string {
   return columns
      .map(col => {
         const v = row[col]
         return v === null ? "NULL" : String(v)
      })
      .join("\t")
}

function formatAllRows(rows: Record<string, unknown>[], columns: string[]): string {
   const header = columns.join("\t")
   const data = rows.map(r => formatRow(r, columns))
   return [header, ...data].join("\n")
}

export function ResultsTable<T extends Record<string, unknown>>({
   data,
   rowHeight = 26,
   className,
   emptyMessage = "No results",
}: ResultsTableProps<T>) {
   const [sorting, setSorting] = useState<SortingState>([])
   const [ctxMenu, setCtxMenu] = useState<ContextMenuState>({
      visible: false,
      x: 0,
      y: 0,
      type: "cell",
   })
   const [selectedCell, setSelectedCell] = useState<{ rowId: string; colId: string } | null>(null)
   const [selectedRow, setSelectedRow] = useState<string | null>(null)
   const [resizeOverrides, setResizeOverrides] = useState<Record<string, string>>({})
   const parentRef = useRef<HTMLDivElement>(null)
   const resizeRef = useRef<{ colId: string; startX: number; startPct: number } | null>(null)

   const columnMeta = useMemo(() => {
      if (data.length === 0)
         return { types: {} as Record<string, ColumnType>, widths: {} as Record<string, string> }
      const keys = Object.keys(data[0])
      const types: Record<string, ColumnType> = {}
      let totalWeight = 0
      const weights: Record<string, number> = {}

      keys.forEach(key => {
         const values = data.slice(0, 15).map(r => r[key])
         const type = detectColumnType(values)
         types[key] = type
         const w = getColumnWeight(type)
         weights[key] = w
         totalWeight += w
      })

      const widths: Record<string, string> = {}
      keys.forEach(key => {
         const pct = Math.max((weights[key] / totalWeight) * 100, 4)
         widths[key] = `${Math.round(pct * 10) / 10}%`
      })

      return { types, widths }
   }, [data])

   const columns: ColumnDef<T>[] = useMemo(() => {
      if (data.length === 0) return []
      return Object.keys(data[0]).map(key => {
         const colType = columnMeta.types[key] ?? "text"
         return {
            id: key,
            accessorKey: key,
            header: () => (
               <div className="flex items-center gap-1.5 w-full overflow-hidden">
                  <span className="truncate text-[11px] font-medium leading-none">{key}</span>
                  <ColumnTypeIcon type={colType} />
               </div>
            ),
            cell: info => {
               const value = info.getValue()
               if (value === null) return <span className="text-text-muted italic">NULL</span>
               if (typeof value === "object") return JSON.stringify(value)
               return String(value)
            },
            enableSorting: true,
         }
      })
   }, [data, columnMeta.types])

   const dataKey = useMemo(() => {
      if (data.length === 0) return ""
      return Object.keys(data[0]).join(",")
   }, [data])

   useEffect(() => {
      setResizeOverrides({})
   }, [dataKey])

   const getColumnWidth = useCallback(
      (colId: string): string => {
         return resizeOverrides[colId] ?? columnMeta.widths[colId] ?? "auto"
      },
      [resizeOverrides, columnMeta.widths]
   )

   const table = useReactTable({
      data: data as T[],
      columns,
      state: { sorting },
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
   })

   const { rows } = table.getRowModel()

   const virtualizer = useVirtualizer({
      count: rows.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => rowHeight,
      overscan: 15,
   })

   const handleContextMenu = useCallback((e: React.MouseEvent, row?: Row<T>, colName?: string) => {
      e.preventDefault()
      if (row && colName) {
         setCtxMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            type: "cell",
            value: String(row.original[colName] ?? "NULL"),
            rowIndex: row.index,
            columnName: colName,
         })
      } else if (row) {
         setCtxMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            type: "row",
            rowIndex: row.index,
         })
      }
   }, [])

   const handleHeaderContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      setCtxMenu({
         visible: true,
         x: e.clientX,
         y: e.clientY,
         type: "header",
      })
   }, [])

   const closeCtxMenu = useCallback(() => {
      setCtxMenu(prev => ({ ...prev, visible: false }))
   }, [])

   const columnNames = useMemo(() => {
      if (data.length === 0) return []
      return Object.keys(data[0])
   }, [data])

   const handleResizeStart = useCallback(
      (e: React.MouseEvent, colId: string) => {
         e.preventDefault()
         e.stopPropagation()
         const startX = e.clientX
         const currentPct = parseFloat(getColumnWidth(colId))
         resizeRef.current = { colId, startX, startPct: currentPct }

         const handleMouseMove = (moveE: MouseEvent) => {
            if (!resizeRef.current) return
            const container = parentRef.current
            if (!container) return
            const containerWidth = container.clientWidth
            if (containerWidth <= 0) return

            const { colId, startX, startPct } = resizeRef.current
            const delta = moveE.clientX - startX
            const deltaPct = (delta / containerWidth) * 100
            const newPct = Math.max(5, Math.min(80, startPct + deltaPct))

            const keys = Object.keys(columnMeta.widths)
            const otherKeys = keys.filter(k => k !== colId)

            let otherTotal = 0
            const otherCurrent: Record<string, number> = {}
            otherKeys.forEach(k => {
               const pct = parseFloat(getColumnWidth(k))
               otherCurrent[k] = pct
               otherTotal += pct
            })

            if (otherTotal <= 0) return

            const oldColPct = startPct
            const deltaTotal = newPct - oldColPct

            const newOverrides: Record<string, string> = {
               [colId]: `${Math.round(newPct * 10) / 10}%`,
            }
            otherKeys.forEach(k => {
               const share = otherCurrent[k] / otherTotal
               const adjusted = Math.max(otherCurrent[k] - deltaTotal * share, 2)
               newOverrides[k] = `${Math.round(adjusted * 10) / 10}%`
            })

            setResizeOverrides(newOverrides)
         }

         const handleMouseUp = () => {
            resizeRef.current = null
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
            document.body.style.cursor = ""
            document.body.style.userSelect = ""
         }

         document.addEventListener("mousemove", handleMouseMove)
         document.addEventListener("mouseup", handleMouseUp)
         document.body.style.cursor = "col-resize"
         document.body.style.userSelect = "none"
      },
      [columnMeta.widths, getColumnWidth]
   )

   if (data.length === 0) {
      return (
         <div
            className={cn(
               "flex items-center justify-center py-8 text-sm text-text-muted",
               className
            )}
         >
            {emptyMessage}
         </div>
      )
   }

   return (
      <div
         className={cn("overflow-hidden w-full h-full relative", className)}
         onClick={closeCtxMenu}
      >
         <div
            ref={parentRef}
            className="h-full overflow-auto custom-scrollbar relative bg-bg-primary"
         >
            <Table className="text-left border-collapse border-spacing-0">
               <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                     <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => {
                           const width = getColumnWidth(header.column.id)
                           return (
                              <TableHead
                                 key={header.id}
                                 className={cn(
                                    "group relative",
                                    "hover:bg-bg-tertiary transition-colors",
                                    header.column.getCanSort() && "cursor-pointer"
                                 )}
                                 style={{ width }}
                                 onClick={header.column.getToggleSortingHandler()}
                                 onContextMenu={handleHeaderContextMenu}
                              >
                                 <div className="flex items-center gap-1.5 w-full h-full">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0 leading-none">
                                       {flexRender(
                                          header.column.columnDef.header,
                                          header.getContext()
                                       )}
                                    </div>
                                    {header.column.getCanSort() && (
                                       <div className="flex items-center gap-0.5 shrink-0">
                                          {{
                                             asc: (
                                                <IconArrowUp className="h-2.5 w-2.5 text-accent" />
                                             ),
                                             desc: (
                                                <IconArrowDown className="h-2.5 w-2.5 text-accent" />
                                             ),
                                          }[header.column.getIsSorted() as string] ?? (
                                             <IconChevronDown className="h-2.5 w-2.5 text-text-muted/20" />
                                          )}
                                       </div>
                                    )}
                                 </div>
                                 <div
                                    className="absolute right-0 top-1 bottom-1 w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 hover:opacity-100 hover:bg-accent/50 active:bg-accent/70 rounded-full transition-all z-10"
                                    onMouseDown={e => handleResizeStart(e, header.column.id)}
                                    onClick={e => e.stopPropagation()}
                                 >
                                    <div className="w-px h-full mx-auto bg-border/30" />
                                 </div>
                              </TableHead>
                           )
                        })}
                     </TableRow>
                  ))}
               </TableHeader>
               <TableBody>
                  {rows.length ? (
                     virtualizer.getVirtualItems().map(virtualRow => {
                        const row = rows[virtualRow.index]
                        const isRowSelected = selectedRow === row.id
                        return (
                           <TableRow
                              key={row.id}
                              className={cn(
                                 "group transition-colors duration-100",
                                 isRowSelected ? "bg-accent/[0.07]" : "hover:bg-white/[0.015]"
                              )}
                              style={{ height: virtualRow.size }}
                              onContextMenu={e => handleContextMenu(e, row)}
                              onClick={() => setSelectedRow(row.id)}
                           >
                              {row.getVisibleCells().map(cell => {
                                 const isCellSelected =
                                    selectedCell?.rowId === row.id &&
                                    selectedCell?.colId === cell.column.id
                                 const width = getColumnWidth(cell.column.id)
                                 const colType = columnMeta.types[cell.column.id] ?? "text"
                                 const isNumeric = colType === "int" || colType === "float"
                                 return (
                                    <TableCell
                                       key={cell.id}
                                       className={cn(
                                          "cursor-default relative",
                                          isNumeric && "text-right tabular-nums",
                                          isCellSelected &&
                                             "after:absolute after:inset-0 after:border-[1.5px] after:border-accent after:ring-1 after:ring-accent/20 after:z-10 bg-accent/5"
                                       )}
                                       style={{ width }}
                                       onClick={e => {
                                          e.stopPropagation()
                                          setSelectedCell({ rowId: row.id, colId: cell.column.id })
                                          setSelectedRow(row.id)
                                       }}
                                       onDoubleClick={() => {
                                          const val = cell.getValue()
                                          copyToClipboard(val === null ? "NULL" : String(val))
                                       }}
                                       onContextMenu={e => {
                                          e.stopPropagation()
                                          const val = cell.getValue()
                                          setSelectedCell({ rowId: row.id, colId: cell.column.id })
                                          setSelectedRow(row.id)
                                          setCtxMenu({
                                             visible: true,
                                             x: e.clientX,
                                             y: e.clientY,
                                             type: "cell",
                                             value: val === null ? "NULL" : String(val),
                                             rowIndex: row.index,
                                             columnName: cell.column.id,
                                          })
                                          e.preventDefault()
                                       }}
                                       title="Double click to copy"
                                    >
                                       {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                 )
                              })}
                           </TableRow>
                        )
                     })
                  ) : (
                     <TableRow>
                        <TableCell
                           colSpan={columns.length}
                           className="h-24 text-center text-text-muted"
                        >
                           {emptyMessage}
                        </TableCell>
                     </TableRow>
                  )}
               </TableBody>
            </Table>
         </div>

         {ctxMenu.visible && (
            <div
               className="fixed z-50 min-w-[160px] bg-[#141414] border border-[#333] rounded-lg shadow-2xl py-1 overflow-hidden"
               style={{ left: ctxMenu.x, top: ctxMenu.y }}
               onClick={e => e.stopPropagation()}
            >
               {ctxMenu.type === "cell" && (
                  <>
                     <button
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-text-primary hover:bg-bg-quaternary transition-colors text-left"
                        onClick={() => {
                           copyToClipboard(ctxMenu.value ?? "")
                           closeCtxMenu()
                        }}
                     >
                        <IconCopy className="h-3.5 w-3.5" />
                        Copy Cell
                     </button>
                     <button
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-text-primary hover:bg-bg-quaternary transition-colors text-left"
                        onClick={() => {
                           if (ctxMenu.rowIndex !== undefined && rows[ctxMenu.rowIndex]) {
                              const rowData = rows[ctxMenu.rowIndex].original as Record<
                                 string,
                                 unknown
                              >
                              copyToClipboard(formatRow(rowData, columnNames))
                           }
                           closeCtxMenu()
                        }}
                     >
                        <IconCopy className="h-3.5 w-3.5" />
                        Copy Row
                     </button>
                  </>
               )}
               {ctxMenu.type === "row" && (
                  <>
                     <button
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-text-primary hover:bg-bg-quaternary transition-colors text-left"
                        onClick={() => {
                           if (ctxMenu.rowIndex !== undefined && rows[ctxMenu.rowIndex]) {
                              const rowData = rows[ctxMenu.rowIndex].original as Record<
                                 string,
                                 unknown
                              >
                              copyToClipboard(formatRow(rowData, columnNames))
                           }
                           closeCtxMenu()
                        }}
                     >
                        <IconCopy className="h-3.5 w-3.5" />
                        Copy Row
                     </button>
                  </>
               )}
               <div className="border-t border-border/80 my-1" />
               <button
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-text-primary hover:bg-bg-quaternary transition-colors text-left"
                  onClick={() => {
                     copyToClipboard(formatAllRows(data as Record<string, unknown>[], columnNames))
                     closeCtxMenu()
                  }}
               >
                  <IconCopy className="h-3.5 w-3.5" />
                  Copy All ({data.length} rows)
               </button>
               <button
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-text-primary hover:bg-bg-quaternary transition-colors text-left"
                  onClick={() => {
                     const header = columnNames.join("\t")
                     const full = [
                        header,
                        ...data.map(r => formatRow(r as Record<string, unknown>, columnNames)),
                     ].join("\n")
                     copyToClipboard(full)
                     closeCtxMenu()
                  }}
               >
                  <IconCopy className="h-3.5 w-3.5" />
                  Copy All With Headers
               </button>
            </div>
         )}
      </div>
   )
}
