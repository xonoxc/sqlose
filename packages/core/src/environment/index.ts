import { ok, err } from "neverthrow"
import { EnvironmentError, okResult } from "@sqlose/shared"
import type { DBType, Environment, AsyncAppResult } from "@sqlose/shared"
import { loadEnvironments, loadEnvironment, saveEnvironment, deleteEnvironment } from "./store"

let envCounter = 0

function generateId(): string {
   envCounter++
   return `env-${Date.now()}-${envCounter}`
}

export function createEnvironmentRecord(
   dbType: DBType,
   name?: string
): AsyncAppResult<Environment> {
   return Promise.resolve()
      .then(() => {
         const env: Environment = {
            id: generateId(),
            name: name ?? `${dbType}-${envCounter}`,
            dbType,
            status: "creating",
            port: 0,
            uptime: null,
            connectionString: "",
            containerId: null,
            createdAt: new Date().toISOString(),
         }
         saveEnvironment(env)
         return ok(env)
      })
      .catch((e: Error) =>
         err(new EnvironmentError("env:create_failed", e.message ?? "Failed to create environment"))
      )
}

export function getEnvironment(id: string): AsyncAppResult<Environment> {
   const env = loadEnvironment(id)
   return env
      ? Promise.resolve(ok(env))
      : Promise.resolve(err(new EnvironmentError("env:not_found", `Environment ${id} not found`)))
}

export function listEnvironments(): AsyncAppResult<Environment[]> {
   return Promise.resolve(ok(loadEnvironments()))
}

export function updateEnvironment(
   id: string,
   updates: Partial<Environment>
): AsyncAppResult<Environment> {
   const env = loadEnvironment(id)
   if (!env) {
      return Promise.resolve(
         err(new EnvironmentError("env:not_found", `Environment ${id} not found`))
      )
   }
   const updated = { ...env, ...updates }
   saveEnvironment(updated)
   return Promise.resolve(ok(updated))
}

export function destroyEnvironmentRecord(id: string): AsyncAppResult<void> {
   const env = loadEnvironment(id)
   if (!env) {
      return Promise.resolve(
         err(new EnvironmentError("env:not_found", `Environment ${id} not found`))
      )
   }
   deleteEnvironment(id)
   return Promise.resolve(okResult(undefined))
}

export function duplicateEnvironmentRecord(id: string): AsyncAppResult<Environment> {
   const env = loadEnvironment(id)
   if (!env) {
      return Promise.resolve(
         err(new EnvironmentError("env:not_found", `Environment ${id} not found`))
      )
   }
   const duplicate: Environment = {
      ...env,
      id: generateId(),
      name: `${env.name} (copy)`,
      status: "creating",
      port: 0,
      uptime: null,
      connectionString: "",
      containerId: null,
      createdAt: new Date().toISOString(),
   }
   saveEnvironment(duplicate)
   return Promise.resolve(ok(duplicate))
}

export function resetEnvironmentRecord(id: string): AsyncAppResult<Environment> {
   const env = loadEnvironment(id)
   if (!env) {
      return Promise.resolve(
         err(new EnvironmentError("env:not_found", `Environment ${id} not found`))
      )
   }
   const reset: Environment = {
      ...env,
      status: "creating",
      port: 0,
      uptime: null,
      connectionString: "",
      containerId: null,
   }
   saveEnvironment(reset)
   return Promise.resolve(ok(reset))
}
