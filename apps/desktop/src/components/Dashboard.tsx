import { IconDatabase, IconPlus, IconTrash, IconServer } from "@tabler/icons-react"
import { useDashboardState } from "../hooks/useDashboardState"
import { CreateDatabaseFlow } from "./CreateDatabaseFlow"

export function Dashboard() {
   const { showCreateFlow, setShowCreateFlow, environments, handleSelectEnv, handleDestroyEnv } =
      useDashboardState()

   return (
      <div className="flex h-full w-full flex-col bg-[#0c0c0c] text-text-primary overflow-hidden rounded-xl border border-white/10 shadow-2xl relative">
         <div className="flex-1 overflow-y-auto px-8 py-12 custom-scrollbar">
            <div className="max-w-4xl mx-auto flex flex-col gap-8">
               <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3">
                     <IconDatabase className="h-8 w-8 text-accent" />
                     Welcome to SQLLab
                  </h1>
                  <p className="text-text-muted text-base">
                     Select an existing database to start querying, or create a new one.
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                     onClick={() => setShowCreateFlow(true)}
                     className="flex flex-col items-center justify-center bg-[#111] border border-dashed border-[#333] hover:border-accent hover:bg-[#161616] rounded-xl p-5 min-h-[160px] cursor-pointer transition-all duration-200 group gap-3"
                  >
                     <div className="h-10 w-10 rounded-full bg-[#1a1a1a] group-hover:bg-accent/20 flex items-center justify-center transition-colors">
                        <IconPlus className="h-5 w-5 text-text-muted group-hover:text-accent" />
                     </div>
                     <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary">
                        Create Database
                     </span>
                  </button>

                  {environments.map(env => (
                     <div
                        key={env.id}
                        className="flex flex-col bg-[#111] border border-[#222] hover:border-[#444] rounded-xl p-5 shadow-sm transition-all duration-200 cursor-pointer group"
                        onClick={() => handleSelectEnv(env.id)}
                     >
                        <div className="flex items-start justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-text-primary">
                                 {env.dbType === "sqlite" ? (
                                    <IconDatabase className="h-5 w-5 text-accent" />
                                 ) : (
                                    <IconServer className="h-5 w-5 text-blue-400" />
                                 )}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-sm font-semibold text-text-primary">
                                    {env.name || `${env.dbType} Sandbox`}
                                 </span>
                                 <span className="text-xs text-text-muted uppercase tracking-wider font-mono">
                                    {env.dbType}
                                 </span>
                              </div>
                           </div>
                           <button
                              onClick={e => handleDestroyEnv(e, env.id)}
                              className="h-7 w-7 rounded flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Nuke Database"
                           >
                              <IconTrash className="h-4 w-4" />
                           </button>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#222]">
                           <div className="flex items-center gap-1.5">
                              <div
                                 className={`h-2 w-2 rounded-full ${env.status === "running" ? "bg-accent" : "bg-[#555]"}`}
                              ></div>
                              <span className="text-xs text-text-muted">{env.status}</span>
                           </div>
                           <div className="text-[10px] text-text-muted font-mono">
                              {new Date(env.createdAt).toLocaleDateString()}
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
         {showCreateFlow && <CreateDatabaseFlow onClose={() => setShowCreateFlow(false)} />}
      </div>
   )
}
