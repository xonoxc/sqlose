import { useState } from "react"
import { useEnvironmentStore } from "../stores/environmentStore"

export function useDashboardState() {
   const [showCreateFlow, setShowCreateFlow] = useState(false)
   const environments = useEnvironmentStore(s => s.environments)
   const isLoading = useEnvironmentStore(s => s.isLoading)
   const error = useEnvironmentStore(s => s.error)
   const selectEnvironment = useEnvironmentStore(s => s.selectEnvironment)
   const destroyEnvironment = useEnvironmentStore(s => s.destroyEnvironment)

   const handleSelectEnv = (id: string) => {
      selectEnvironment(id)
   }

   const handleDestroyEnv = (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      destroyEnvironment(id)
   }

   return {
      showCreateFlow,
      setShowCreateFlow,
      environments,
      isLoading,
      error,
      handleSelectEnv,
      handleDestroyEnv,
   }
}
