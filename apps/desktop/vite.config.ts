import { defineConfig } from "vite"
import path from "node:path"
import electron from "vite-plugin-electron/simple"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import fs from "node:fs"

const DESKTOP_DIR = __dirname
const CORE_NM = path.resolve(DESKTOP_DIR, "../../packages/core/node_modules")
const dest = path.resolve(DESKTOP_DIR, "node_modules")
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
for (const dep of [
   "pg",
   "mysql2",
   "sqlite3",
   "dockerode",
   "electron-store",
   "bindings",
   "node-gyp-build",
]) {
   const src = path.resolve(CORE_NM, dep)
   const dst = path.resolve(dest, dep)
   if (fs.existsSync(src) && !fs.existsSync(dst)) {
      try {
         fs.symlinkSync(src, dst, "dir")
      } catch {
         /* ok */
      }
   }
}

// Native Node.js packages that must NOT be bundled by Rollup.
// These use native .node addons or dynamic require() via `bindings`,
// which Rollup/Vite cannot handle. They'll be resolved from node_modules at runtime.
const NATIVE_EXTERNALS = [
   "sqlite3",
   "pg",
   "pg-native",
   "mysql2",
   "dockerode",
   "electron-store",
   "better-sqlite3",
   "bindings",
   "node-gyp-build",
]

export default defineConfig({
   plugins: [
      react(),
      tailwindcss(),
      electron({
         main: {
            entry: "electron/main.ts",
            vite: {
               resolve: {
                  alias: {
                     "@sqlose/shared": path.resolve(DESKTOP_DIR, "../../packages/shared/src"),
                     "@sqlose/core": path.resolve(DESKTOP_DIR, "../../packages/core/src"),
                  },
               },
               build: {
                  rollupOptions: {
                     external: (id: string) => {
                        // Externalize native packages and their subpaths (e.g. "sqlite3/lib/...")
                        if (id.endsWith(".node")) return true
                        for (const ext of NATIVE_EXTERNALS) {
                           if (id === ext || id.startsWith(ext + "/")) return true
                        }
                        return false
                     },
                  },
               },
            },
         },
         preload: {
            input: path.join(DESKTOP_DIR, "electron/preload.ts"),
            vite: {
               resolve: {
                  alias: {
                     "@sqlose/shared": path.resolve(DESKTOP_DIR, "../../packages/shared/src"),
                  },
               },
            },
         },
         renderer: process.env.NODE_ENV === "test" ? undefined : {},
      }),
   ],
   resolve: {
      alias: {
         "@sqlose/shared": path.resolve(DESKTOP_DIR, "../../packages/shared/src"),
         "@sqlose/ui": path.resolve(DESKTOP_DIR, "../../packages/ui/src"),
         "@sqlose/core": path.resolve(DESKTOP_DIR, "../../packages/core/src"),
      },
   },
})
