"use client"

import { Database, Terminal, Layout, Cpu, Download, Code2, Box, ChevronRight } from "lucide-react"

const CornerMarker = ({ className = "bg-white/30" }: { className?: string }) => (
   <div className={`absolute w-1.5 h-1.5 ${className} z-10`} />
)

export default function SQLoseLinyPage() {
   return (
      <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
         <div
            className="fixed inset-0 pointer-events-none opacity-[0.15]"
            style={{
               backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
               backgroundSize: "4rem 4rem",
            }}
         />
         <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)]" />

         <nav className="relative border-b border-white/10 bg-[#050505]/80 backdrop-blur-md z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6 relative">
               <CornerMarker className="bottom-[-3px] left-0 bg-emerald-500" />
               <CornerMarker className="bottom-[-3px] right-0 bg-emerald-500" />

               <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold text-white tracking-tight text-lg">
                     SQL<span className="text-emerald-500">ose</span>
                  </span>
               </div>

               <div className="hidden md:flex items-center gap-8 text-sm font-mono text-zinc-500">
                  <a href="#features" className="hover:text-amber-400 transition-colors">
                     .features()
                  </a>
                  <a href="#stack" className="hover:text-purple-400 transition-colors">
                     .stack()
                  </a>
                  <a href="#docs" className="hover:text-blue-400 transition-colors">
                     .docs()
                  </a>
               </div>

               <div className="flex items-center gap-4">
                  <a href="#" className="text-zinc-500 hover:text-white transition-colors">
                     <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                     </svg>
                  </a>
                  <button className="flex items-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 text-white px-4 py-1.5 text-sm font-medium transition-colors font-mono">
                     <Download className="w-4 h-4" />
                     Get App
                  </button>
               </div>
            </div>
         </nav>

         <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 relative z-10">
               <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/10 bg-white/5 text-xs font-mono text-amber-400 mb-8">
                  <span className="w-2 h-2 bg-amber-400 animate-pulse" />
                  v1.0.0_release
               </div>

               <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
                  The{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                     ephemeral
                  </span>{" "}
                  stack <br />
                  for data artisans.
               </h1>

               <p className="text-xl text-zinc-400 mb-10 max-w-xl font-light leading-relaxed">
                  <span className="text-purple-400 font-mono text-sm mr-2">const</span>
                  flow ={" "}
                  <span className="text-amber-300 font-mono text-sm">
                     ['spin up', 'query', 'throw away']
                  </span>
                  ;
                  <br className="mb-2" />
                  SQLose gives you fully isolated DB environments with zero configuration and zero
                  leftover clutter.
               </p>

               <div className="flex flex-col sm:flex-row gap-4">
                  <button className="flex items-center justify-center gap-2 border border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-6 py-3 font-mono transition-colors">
                     <Download className="w-5 h-5" />
                     Download for Mac
                  </button>
                  <button className="flex items-center justify-center gap-2 border border-white/20 bg-transparent text-white hover:bg-white/5 px-6 py-3 font-mono transition-colors">
                     <Terminal className="w-5 h-5" />
                     brew install sqlose
                  </button>
               </div>
            </div>

            <div className="flex-1 w-full h-[500px] flex items-center justify-center relative perspective-[1000px]">
               <div
                  className="relative w-72 h-72 scale-75 md:scale-100"
                  style={{
                     transformStyle: "preserve-3d",
                     transform: "rotateX(60deg) rotateZ(-45deg)",
                  }}
               >
                  <div
                     className="absolute inset-0 border border-purple-500 bg-purple-950/40 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.15)] flex items-end p-4 transition-transform duration-700 hover:translate-z-10"
                     style={{ transform: "translateZ(120px)" }}
                  >
                     <div className="font-mono text-xs text-purple-400 border border-purple-500/30 bg-purple-950/50 px-2 py-1">
                        Electron.Window
                     </div>
                  </div>

                  <div
                     className="absolute top-1/2 left-1/2 w-px h-[60px] bg-white/20 border-l border-dashed border-purple-500/50"
                     style={{ transform: "rotateX(-90deg) translateZ(30px) translateY(-30px)" }}
                  />

                  <div
                     className="absolute inset-4 border border-amber-500/80 bg-amber-950/40 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.1)] flex items-end p-4"
                     style={{ transform: "translateZ(60px)" }}
                  >
                     <div className="font-mono text-xs text-amber-400 border border-amber-500/30 bg-amber-950/50 px-2 py-1">
                        Core.Manager
                     </div>
                  </div>

                  <div
                     className="absolute top-1/2 left-1/4 w-px h-[60px] bg-white/20 border-l border-dashed border-amber-500/50"
                     style={{ transform: "rotateX(-90deg) translateZ(-30px) translateY(-30px)" }}
                  />
                  <div
                     className="absolute top-1/2 right-1/4 w-px h-[60px] bg-white/20 border-l border-dashed border-amber-500/50"
                     style={{ transform: "rotateX(-90deg) translateZ(-30px) translateY(-30px)" }}
                  />

                  <div
                     className="absolute inset-[-10px] border border-blue-500/50 bg-blue-950/20 grid grid-cols-2 gap-4 p-4"
                     style={{ transform: "translateZ(0px)" }}
                  >
                     <div className="border border-blue-400/30 bg-blue-500/10 flex items-center justify-center">
                        <span className="font-mono text-[10px] text-blue-300">PGSQL</span>
                     </div>
                     <div className="border border-blue-400/30 bg-blue-500/10 flex items-center justify-center">
                        <span className="font-mono text-[10px] text-blue-300">MYSQL</span>
                     </div>
                     <div className="border border-blue-400/30 bg-blue-500/10 flex items-center justify-center col-span-2">
                        <span className="font-mono text-[10px] text-blue-300">SQLITE</span>
                     </div>

                     <div className="absolute -bottom-6 left-2 font-mono text-xs text-blue-500">
                        Docker.Daemon
                     </div>
                  </div>
               </div>
            </div>
         </section>

         <section className="relative border-y border-white/10 bg-[#0a0a0c] overflow-hidden">
            <CornerMarker className="top-[-3px] left-1/4 bg-amber-500 hidden md:block" />
            <CornerMarker className="bottom-[-3px] left-1/4 bg-amber-500 hidden md:block" />
            <CornerMarker className="top-[-3px] right-1/4 bg-amber-500 hidden md:block" />
            <CornerMarker className="bottom-[-3px] right-1/4 bg-amber-500 hidden md:block" />

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
               <div className="p-6 md:p-8 flex items-center justify-center md:justify-start w-full md:w-1/4">
                  <span className="font-mono text-xs text-zinc-500 tracking-widest uppercase">
                     <span className="text-amber-500 mr-2">{"//"}</span> Tech Stack
                  </span>
               </div>
               <div className="p-6 md:p-8 flex items-center justify-center w-full md:w-1/4 font-mono text-sm text-zinc-400 hover:text-white hover:bg-white/[0.02] transition-colors">
                  <Box className="w-4 h-4 mr-2 text-purple-400" /> Electron
               </div>
               <div className="p-6 md:p-8 flex items-center justify-center w-full md:w-1/4 font-mono text-sm text-zinc-400 hover:text-white hover:bg-white/[0.02] transition-colors">
                  <Code2 className="w-4 h-4 mr-2 text-blue-400" /> React + Zustand
               </div>
               <div className="p-6 md:p-8 flex items-center justify-center w-full md:w-1/4 font-mono text-sm text-zinc-400 hover:text-white hover:bg-white/[0.02] transition-colors">
                  <Cpu className="w-4 h-4 mr-2 text-emerald-400" /> Monaco Editor
               </div>
            </div>
         </section>

         <section className="relative max-w-6xl mx-auto px-6 py-24 z-10">
            <div className="mb-12">
               <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">The Workspace</h2>
               <p className="font-mono text-sm text-zinc-500">
                  class UI extends App {"{"} ... {"}"}
               </p>
            </div>

            <div className="relative border border-white/20 bg-[#050505] p-2 md:p-4 before:absolute before:-inset-2 before:border before:border-white/5 before:pointer-events-none">
               <CornerMarker className="top-[-3px] left-[-3px] bg-purple-500" />
               <CornerMarker className="top-[-3px] right-[-3px] bg-purple-500" />
               <CornerMarker className="bottom-[-3px] left-[-3px] bg-purple-500" />
               <CornerMarker className="bottom-[-3px] right-[-3px] bg-purple-500" />

               <div className="border border-white/10 relative overflow-hidden bg-[#0d0d0d]">
                  <div className="border-b border-white/10 h-10 flex items-center px-4 justify-between bg-[#111]">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 border border-zinc-600 rounded-full" />
                        <div className="w-3 h-3 border border-zinc-600 rounded-full" />
                        <div className="w-3 h-3 border border-zinc-600 rounded-full" />
                     </div>
                     <div className="font-mono text-xs text-zinc-500">sqlose-database</div>
                     <div className="w-10"></div>
                  </div>

                  <img
                     src="/ss.png"
                     alt="SQLose Application Interface"
                     className="w-full h-auto object-cover block"
                     onError={e => {
                        e.currentTarget.style.display = "none"
                        ;(e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove(
                           "hidden"
                        )
                     }}
                  />

                  <div className="hidden h-[400px] w-full flex items-center justify-center font-mono text-xs text-zinc-600 bg-[#050505]">
                     [ Image Missing: Drop ss.png in /public ]
                  </div>
               </div>
            </div>
         </section>

         <section id="features" className="relative border-t border-white/10 bg-[#050505]">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
               <div className="p-10 md:p-16 relative group hover:bg-white/[0.01] transition-colors">
                  <CornerMarker className="top-[-3px] left-[-3px] bg-zinc-700 hidden md:block" />
                  <div className="mb-8 p-4 border border-white/10 w-16 h-16 flex items-center justify-center text-emerald-400 bg-emerald-500/5">
                     <Database className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Ephemeral by Design</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                     Launch isolated environments instantly. Close the app, and the containers
                     vanish.
                  </p>
                  <div className="font-mono text-xs text-zinc-600 group-hover:text-emerald-500 transition-colors">
                     docker run --rm sqlose
                  </div>
               </div>

               <div className="p-10 md:p-16 relative group hover:bg-white/[0.01] transition-colors">
                  <div className="mb-8 p-4 border border-white/10 w-16 h-16 flex items-center justify-center text-amber-400 bg-amber-500/5">
                     <Code2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Monaco Powered</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                     Full syntax highlighting, autocomplete, and optional Vim bindings integrated
                     out-of-the-box.
                  </p>
                  <div className="font-mono text-xs text-zinc-600 group-hover:text-amber-500 transition-colors">
                     import {"{"} Editor {"}"} from '@monaco'
                  </div>
               </div>

               <div className="p-10 md:p-16 relative group hover:bg-white/[0.01] transition-colors">
                  <CornerMarker className="top-[-3px] right-[-3px] bg-zinc-700 hidden md:block" />
                  <div className="mb-8 p-4 border border-white/10 w-16 h-16 flex items-center justify-center text-blue-400 bg-blue-500/5">
                     <Layout className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Resizable Architecture</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                     Built with a custom horizontal split layout using{" "}
                     <span className="text-purple-400 font-mono">flex-1 min-w-0</span> for fluid
                     scaling.
                  </p>
                  <div className="font-mono text-xs text-zinc-600 group-hover:text-blue-500 transition-colors">
                     {"<ResizablePane />"}
                  </div>
               </div>
            </div>
         </section>

         <footer className="border-t border-white/10 bg-[#020202] relative">
            <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12 font-mono text-sm">
               <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                     <Database className="w-5 h-5 text-emerald-500" />
                     <span className="font-bold text-white text-base">SQLose</span>
                  </div>
                  <p className="text-zinc-500 mb-6 max-w-xs">
                     ephemeral SQL environments. spin up. query. throw away.
                  </p>
                  <a
                     href="#"
                     className="inline-flex items-center text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                     Initialize <ChevronRight className="w-4 h-4 ml-1" />
                  </a>
               </div>

               <div>
                  <h4 className="text-zinc-300 mb-4 border-b border-white/10 pb-2 inline-block">
                     Modules
                  </h4>
                  <ul className="space-y-3 text-zinc-500">
                     <li>
                        <a href="#" className="hover:text-blue-400 transition-colors">
                           Desktop App
                        </a>
                     </li>
                     <li>
                        <a href="#" className="hover:text-blue-400 transition-colors">
                           Core Engine
                        </a>
                     </li>
                     <li>
                        <a href="#" className="hover:text-blue-400 transition-colors">
                           Docker Drivers
                        </a>
                     </li>
                  </ul>
               </div>

               <div>
                  <h4 className="text-zinc-300 mb-4 border-b border-white/10 pb-2 inline-block">
                     System
                  </h4>
                  <ul className="space-y-3 text-zinc-500">
                     <li>
                        <a href="#" className="hover:text-amber-400 transition-colors">
                           GitHub Repository
                        </a>
                     </li>
                     <li>
                        <a href="#" className="hover:text-amber-400 transition-colors">
                           Documentation
                        </a>
                     </li>
                     <li>
                        <a href="#" className="hover:text-amber-400 transition-colors">
                           Releases
                        </a>
                     </li>
                  </ul>
               </div>
            </div>

            <div className="border-t border-white/10 px-6 py-4 text-center font-mono text-xs text-zinc-600 flex justify-between items-center max-w-7xl mx-auto">
               <span>&copy; {new Date().getFullYear()} SQLose. All rights reserved.</span>
               <span>
                  status: <span className="text-emerald-500">online</span>
               </span>
            </div>
         </footer>
      </div>
   )
}
