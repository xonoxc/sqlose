import { useState, useCallback } from "react"
import { useEnvironmentStore } from "../stores/environmentStore"
import type { Environment } from "@sqlose/shared"

export function useEnvironmentActionsLogic(environment: Environment | null) {
   const [showDestroyConfirm, setShowDestroyConfirm] = useState(false)
   const [showNukeConfirm, setShowNukeConfirm] = useState(false)
   const startEnvironment = useEnvironmentStore(s => s.startEnvironment)
   const stopEnvironment = useEnvironmentStore(s => s.stopEnvironment)
   const restartEnvironment = useEnvironmentStore(s => s.restartEnvironment)
   const destroyEnvironment = useEnvironmentStore(s => s.destroyEnvironment)
   const nukeEnvironment = useEnvironmentStore(s => s.nukeEnvironment)
   const isLoading = useEnvironmentStore(s => s.isLoading)

   const handleStart = useCallback(() => {
      if (environment) startEnvironment(environment.id)
   }, [environment, startEnvironment])

   const handleStop = useCallback(() => {
      if (environment) stopEnvironment(environment.id)
   }, [environment, stopEnvironment])

   const handleRestart = useCallback(() => {
      if (environment) restartEnvironment(environment.id)
   }, [environment, restartEnvironment])

   const handleDestroy = useCallback(async () => {
      if (environment) {
         await destroyEnvironment(environment.id)
         setShowDestroyConfirm(false)
      }
   }, [environment, destroyEnvironment])

   const handleNuke = useCallback(async () => {
      if (environment) {
         await nukeEnvironment(environment.id)
         setShowNukeConfirm(false)
      }
   }, [environment, nukeEnvironment])

   return {
      showDestroyConfirm,
      setShowDestroyConfirm,
      showNukeConfirm,
      setShowNukeConfirm,
      isLoading,
      handleStart,
      handleStop,
      handleRestart,
      handleDestroy,
      handleNuke,
   }
}
