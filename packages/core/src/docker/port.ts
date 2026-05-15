import { createServer } from "net"
import { ok, err } from "neverthrow"
import { DockerError } from "@sqlose/shared"
import type { AsyncAppResult } from "@sqlose/shared"

export function findAvailablePort(min = 4000, max = 6000): AsyncAppResult<number> {
   return new Promise(resolve => {
      function tryPort(port: number): void {
         if (port > max) {
            resolve(
               err(
                  new DockerError(
                     "docker:port_conflict",
                     `No available ports in range ${min}-${max}`
                  )
               )
            )
            return
         }
         const server = createServer()
         server.on("error", () => {
            server.close(() => tryPort(port + 1))
         })
         server.listen(port, () => {
            server.close(() => resolve(ok(port)))
         })
      }
      tryPort(min)
   })
}

const usedPorts = new Set<number>()

export function reservePort(port: number): boolean {
   if (usedPorts.has(port)) return false
   usedPorts.add(port)
   return true
}

export function releasePort(port: number): void {
   usedPorts.delete(port)
}
