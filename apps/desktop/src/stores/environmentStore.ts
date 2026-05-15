import { create } from "zustand"
import { persist } from "zustand/middleware"
import { ok, err, type Result } from "neverthrow"
import { AppError } from "@sqlose/shared"
import { api } from "../lib/api"

import type { Environment, DBType } from "@sqlose/shared"

interface EnvironmentStore {
   environments: Environment[]
   selectedEnvironmentId: string | null
   isLoading: boolean
   error: string | null

   fetchEnvironments: () => Promise<Result<Environment[], AppError>>
   createEnvironment: (dbType: DBType, name?: string) => Promise<Result<Environment, AppError>>
   destroyEnvironment: (environmentId: string) => Promise<Result<string, AppError>>
   startEnvironment: (
      environmentId: string
   ) => Promise<Result<{ port: number; connectionString: string }, AppError>>
   stopEnvironment: (environmentId: string) => Promise<Result<string, AppError>>
   restartEnvironment: (environmentId: string) => Promise<Result<string, AppError>>
   duplicateEnvironment: (environmentId: string) => Promise<Result<Environment, AppError>>
   resetEnvironment: (environmentId: string) => Promise<Result<Environment, AppError>>
   nukeEnvironment: (environmentId: string) => Promise<Result<Environment, AppError>>
   selectEnvironment: (environmentId: string | null) => Result<string | null, AppError>
   getEnvironment: (environmentId: string) => Environment | undefined
}

export const useEnvironmentStore = create<EnvironmentStore>()(
   persist(
      (set, get) => ({
         environments: [],
         selectedEnvironmentId: null,
         isLoading: false,
         error: null,

         fetchEnvironments: async () => {
            set({ isLoading: true, error: null })
            const result = await api.env.list()

            if (result.isOk()) {
               set({ environments: result.value, isLoading: false })
               return result
            }

            set({ error: result.error.message, isLoading: false })
            return result
         },

         createEnvironment: async (dbType: DBType, name?: string) => {
            set({ isLoading: true, error: null })
            const result = await api.env.create(dbType, name)

            if (result.isOk()) {
               const current = get().environments
               set({
                  environments: [...current, result.value],
                  isLoading: false,
               })
            } else {
               set({ error: result.error.message, isLoading: false })
            }

            return result
         },

         destroyEnvironment: async (environmentId: string) => {
            set({ isLoading: true, error: null })
            const result = await api.env.destroy(environmentId)

            if (result.isOk()) {
               const current = get()
               set({
                  environments: current.environments.filter(e => e.id !== environmentId),
                  selectedEnvironmentId:
                     current.selectedEnvironmentId === environmentId
                        ? null
                        : current.selectedEnvironmentId,
                  isLoading: false,
               })
               return ok(environmentId)
            }

            set({ error: result.error.message, isLoading: false })
            return err(result.error)
         },

         startEnvironment: async (environmentId: string) => {
            set({ isLoading: true, error: null })
            const env = get().getEnvironment(environmentId)

            if (!env) {
               set({ isLoading: false })
               return err(new AppError("env:not_found", `Environment ${environmentId} not found`))
            }

            if (env.dbType === "sqlite") {
               const updateResult = await api.env.get(environmentId)
               if (updateResult.isOk()) {
                  const environments = get().environments.map(e =>
                     e.id === environmentId
                        ? { ...updateResult.value, status: "running" as const }
                        : e
                  )
                  set({
                     environments,
                     isLoading: false,
                  })
                  return ok({ port: 0, connectionString: env.connectionString })
               }
            }

            const result = await api.docker.startEnv(environmentId)

            if (result.isOk()) {
               const updateResult = await api.env.get(environmentId)
               if (updateResult.isOk()) {
                  const environments = get().environments.map(e =>
                     e.id === environmentId ? updateResult.value : e
                  )
                  set({ environments, isLoading: false })
               } else {
                  set({ isLoading: false })
               }
            } else {
               set({ error: result.error.message, isLoading: false })
            }

            return result
         },

         stopEnvironment: async (environmentId: string) => {
            set({ isLoading: true, error: null })
            const result = await api.docker.stopEnv(environmentId)

            if (result.isOk()) {
               const updateResult = await api.env.get(environmentId)
               if (updateResult.isOk()) {
                  const environments = get().environments.map(e =>
                     e.id === environmentId ? updateResult.value : e
                  )
                  set({ environments, isLoading: false })
               } else {
                  set({ isLoading: false })
               }
               return ok(environmentId)
            }

            set({ error: result.error.message, isLoading: false })
            return err(result.error)
         },

         restartEnvironment: async (environmentId: string) => {
            set({ isLoading: true, error: null })
            const result = await api.docker.restartEnv(environmentId)

            if (result.isOk()) {
               const updateResult = await api.env.get(environmentId)
               if (updateResult.isOk()) {
                  const environments = get().environments.map(e =>
                     e.id === environmentId ? updateResult.value : e
                  )
                  set({ environments, isLoading: false })
               } else {
                  set({ isLoading: false })
               }
               return ok(environmentId)
            }

            set({ error: result.error.message, isLoading: false })
            return err(result.error)
         },

         duplicateEnvironment: async (environmentId: string) => {
            set({ isLoading: true, error: null })
            const result = await api.env.duplicate(environmentId)

            if (result.isOk()) {
               const current = get().environments
               set({
                  environments: [...current, result.value],
                  isLoading: false,
               })
            } else {
               set({ error: result.error.message, isLoading: false })
            }

            return result
         },

         resetEnvironment: async (environmentId: string) => {
            set({ isLoading: true, error: null })
            const result = await api.env.reset(environmentId)

            if (result.isOk()) {
               const environments = get().environments.map(e =>
                  e.id === environmentId ? result.value : e
               )
               set({ environments, isLoading: false })
            } else {
               set({ error: result.error.message, isLoading: false })
            }

            return result
         },

         nukeEnvironment: async (environmentId: string) => {
            set({ isLoading: true, error: null })
            const result = await api.env.nuke(environmentId)

            if (result.isOk()) {
               const environments = get().environments.map(e =>
                  e.id === environmentId ? result.value : e
               )
               set({ environments, isLoading: false })
            } else {
               set({ error: result.error.message, isLoading: false })
            }

            return result
         },

         selectEnvironment: (environmentId: string | null) => {
            if (environmentId !== null) {
               const exists = get().environments.some(e => e.id === environmentId)
               if (!exists) {
                  return err(
                     new AppError("env:not_found", `Environment ${environmentId} not found`)
                  )
               }
            }
            set({ selectedEnvironmentId: environmentId })
            return ok(environmentId)
         },

         getEnvironment: (environmentId: string) => {
            return get().environments.find(e => e.id === environmentId)
         },
      }),
      {
         name: "sqlose-environments",
         partialize: state => ({
            environments: state.environments,
            selectedEnvironmentId: state.selectedEnvironmentId,
         }),
      }
   )
)
