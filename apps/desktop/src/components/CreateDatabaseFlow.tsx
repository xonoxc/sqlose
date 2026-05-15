import {
   IconDatabase,
   IconServer,
   IconCheck,
   IconLoader2,
   IconCircleCheck,
   IconX,
   IconArrowRight,
   IconDatabaseImport,
} from "@tabler/icons-react"
import { Button, Input, Badge } from "@sqlose/ui"
import type { DBType } from "@sqlose/shared"
import { useCreateDatabaseFlowLogic } from "../hooks/useCreateDatabaseFlowLogic"

const DB_CARDS: {
   type: DBType
   label: string
   description: string
   icon: typeof IconDatabase | typeof IconServer
   accent: string
}[] = [
   {
      type: "postgres",
      label: "PostgreSQL",
      description: "Advanced relational database with ACID compliance and rich extensions",
      icon: IconServer,
      accent: "from-blue-500/20 to-blue-600/10",
   },
   {
      type: "mysql",
      label: "MySQL",
      description: "Popular open-source relational database for web applications",
      icon: IconServer,
      accent: "from-orange-500/20 to-orange-600/10",
   },
   {
      type: "sqlite",
      label: "SQLite",
      description: "Lightweight embedded database with zero configuration needed",
      icon: IconDatabase,
      accent: "from-teal-500/20 to-teal-600/10",
   },
]

const CATEGORY_COLORS: Record<string, "default" | "secondary" | "warning" | "success"> = {
   ecommerce: "success",
   analytics: "default",
   social: "warning",
   finance: "secondary",
}

export function CreateDatabaseFlow({ onClose }: { onClose: () => void }) {
   const {
      step,
      selectedDbType,
      selectedDataset,
      setSelectedDataset,
      dbName,
      setDbName,
      provisioningSteps,
      provisioningError,
      datasets,
      datasetsLoading,
      creating,
      allDone,
      handleSelectType,
      handleCreate,
      setStep,
   } = useCreateDatabaseFlowLogic(onClose)

   if (step === "provisioning") {
      return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-10 max-w-md w-full mx-4 shadow-2xl">
               <div className="flex flex-col items-center gap-8">
                  <div className="relative">
                     <div className="h-16 w-16 rounded-full border-2 border-accent/30 flex items-center justify-center">
                        {allDone ? (
                           <IconCircleCheck className="h-8 w-8 text-accent" />
                        ) : provisioningError ? (
                           <IconX className="h-8 w-8 text-error" />
                        ) : (
                           <IconLoader2 className="h-8 w-8 text-accent animate-spin" />
                        )}
                     </div>
                  </div>

                  <div className="text-center">
                     <h2 className="text-xl font-bold text-text-primary">
                        {provisioningError
                           ? "Setup Failed"
                           : allDone
                             ? "Environment Ready"
                             : "Setting Up Environment"}
                     </h2>
                     <p className="text-sm text-text-muted mt-1">
                        {provisioningError
                           ? "Something went wrong during setup"
                           : allDone
                             ? "Redirecting to query workspace..."
                             : "This should only take a moment"}
                     </p>
                  </div>

                  <div className="w-full space-y-2">
                     {provisioningSteps.map(ps => (
                        <div
                           key={ps.id}
                           className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                              ps.status === "in-progress"
                                 ? "bg-accent/10 border border-accent/20"
                                 : ps.status === "done"
                                   ? "bg-success/5"
                                   : ps.status === "error"
                                     ? "bg-error/10"
                                     : "bg-[#111] opacity-50"
                           }`}
                        >
                           {ps.status === "done" ? (
                              <IconCircleCheck className="h-4 w-4 text-success shrink-0" />
                           ) : ps.status === "in-progress" ? (
                              <IconLoader2 className="h-4 w-4 text-accent animate-spin shrink-0" />
                           ) : ps.status === "error" ? (
                              <IconX className="h-4 w-4 text-error shrink-0" />
                           ) : (
                              <div className="h-4 w-4 rounded-full border border-dashed border-text-muted shrink-0" />
                           )}
                           <span
                              className={
                                 ps.status === "error"
                                    ? "text-error"
                                    : ps.status === "done"
                                      ? "text-success"
                                      : "text-text-primary"
                              }
                           >
                              {ps.label}
                           </span>
                           {ps.message && (
                              <span className="text-xs text-text-muted ml-auto truncate max-w-[160px]">
                                 {ps.message}
                              </span>
                           )}
                        </div>
                     ))}
                  </div>

                  {provisioningError && (
                     <Button variant="secondary" onClick={onClose}>
                        Close
                     </Button>
                  )}
               </div>
            </div>
         </div>
      )
   }

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
         <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e] shrink-0">
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                     <span
                        className={`text-xs font-mono transition-colors ${step === "select-type" ? "text-accent" : "text-success"}`}
                     >
                        1. Select Type
                     </span>
                     <IconArrowRight className="h-3 w-3 text-text-muted" />
                     <span
                        className={`text-xs font-mono transition-colors ${step === "configure" ? "text-accent" : "text-text-muted"}`}
                     >
                        2. Configure
                     </span>
                  </div>
               </div>
               <button
                  onClick={onClose}
                  className="h-7 w-7 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-[#1a1a1a] transition-colors"
               >
                  <IconX className="h-4 w-4" />
               </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
               {step === "select-type" && (
                  <div className="space-y-5">
                     <div>
                        <h2 className="text-lg font-bold text-text-primary">
                           Choose Database Type
                        </h2>
                        <p className="text-sm text-text-muted mt-1">
                           Select the type of database you want to create
                        </p>
                     </div>
                     <div className="grid gap-3">
                        {DB_CARDS.map(card => (
                           <button
                              key={card.type}
                              onClick={() => handleSelectType(card.type)}
                              className="flex items-start gap-4 bg-[#111] border border-[#222] hover:border-accent/50 hover:bg-[#161616] rounded-xl p-4 text-left transition-all cursor-pointer group"
                           >
                              <div
                                 className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.accent} border border-white/5 flex items-center justify-center shrink-0`}
                              >
                                 <card.icon className="h-6 w-6 text-text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
                                    {card.label}
                                 </h3>
                                 <p className="text-sm text-text-muted mt-0.5">
                                    {card.description}
                                 </p>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center shrink-0 group-hover:border-accent/50 group-hover:bg-accent/10 transition-all">
                                 <IconArrowRight className="h-4 w-4 text-text-muted group-hover:text-accent transition-colors" />
                              </div>
                           </button>
                        ))}
                     </div>
                  </div>
               )}

               {step === "configure" && (
                  <div className="space-y-6">
                     <div>
                        <h2 className="text-lg font-bold text-text-primary">Name Your Database</h2>
                        <p className="text-sm text-text-muted mt-1">
                           Give your database a memorable name
                        </p>
                     </div>

                     <Input
                        value={dbName}
                        onChange={e => setDbName(e.target.value)}
                        placeholder="Database name"
                        className="w-full"
                     />

                     <div>
                        <div className="flex items-center justify-between mb-3">
                           <h3 className="text-sm font-semibold text-text-primary">
                              Import Dataset (optional)
                           </h3>
                           {selectedDataset && (
                              <button
                                 onClick={() => setSelectedDataset(null)}
                                 className="text-xs text-text-muted hover:text-error transition-colors"
                              >
                                 Clear selection
                              </button>
                           )}
                        </div>

                        {datasetsLoading ? (
                           <div className="flex items-center justify-center py-8">
                              <IconLoader2 className="h-5 w-5 text-text-muted animate-spin" />
                           </div>
                        ) : datasets.length === 0 ? (
                           <div className="bg-[#111] border border-dashed border-[#333] rounded-xl p-6 text-center">
                              <IconDatabaseImport className="h-8 w-8 text-text-muted mx-auto mb-2" />
                              <p className="text-sm text-text-muted">No datasets available</p>
                              <p className="text-xs text-text-muted mt-1">
                                 You can start with an empty database
                              </p>
                           </div>
                        ) : (
                           <div className="grid gap-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                              {datasets
                                 .filter(ds => ds.dbTypes.includes(selectedDbType!))
                                 .map(ds => (
                                    <button
                                       key={ds.id}
                                       onClick={() =>
                                          setSelectedDataset(
                                             selectedDataset?.id === ds.id ? null : ds
                                          )
                                       }
                                       className={`flex items-center gap-3 rounded-xl p-3.5 text-left transition-all cursor-pointer border ${
                                          selectedDataset?.id === ds.id
                                             ? "border-accent/50 bg-accent/5"
                                             : "border-[#222] bg-[#111] hover:border-[#444] hover:bg-[#161616]"
                                       }`}
                                    >
                                       <div
                                          className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                                             selectedDataset?.id === ds.id
                                                ? "bg-accent/20 text-accent"
                                                : "bg-[#1a1a1a] text-text-muted"
                                          }`}
                                       >
                                          <IconDatabaseImport className="h-5 w-5" />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                             <span className="text-sm font-medium text-text-primary">
                                                {ds.name}
                                             </span>
                                             <Badge
                                                variant={
                                                   CATEGORY_COLORS[ds.category] ?? "secondary"
                                                }
                                                className="text-[10px] px-1.5 py-0"
                                             >
                                                {ds.category}
                                             </Badge>
                                          </div>
                                          <p className="text-xs text-text-muted mt-0.5 truncate">
                                             {ds.description}
                                          </p>
                                       </div>
                                       {selectedDataset?.id === ds.id && (
                                          <IconCheck className="h-5 w-5 text-accent shrink-0" />
                                       )}
                                    </button>
                                 ))}
                           </div>
                        )}
                     </div>
                  </div>
               )}
            </div>

            {/* Footer */}
            {step === "configure" && (
               <div className="flex items-center justify-between px-6 py-4 border-t border-[#1e1e1e] shrink-0">
                  <button
                     onClick={() => {
                        setSelectedDataset(null)
                        setStep("select-type")
                     }}
                     className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                     Back
                  </button>
                  <Button onClick={handleCreate} disabled={creating} size="sm" className="gap-1.5">
                     {creating ? (
                        <>
                           <IconLoader2 className="h-4 w-4 animate-spin" />
                           Creating...
                        </>
                     ) : (
                        <>
                           <IconDatabase className="h-4 w-4" />
                           {selectedDataset ? "Create & Import" : "Create Database"}
                        </>
                     )}
                  </Button>
               </div>
            )}
         </div>
      </div>
   )
}
