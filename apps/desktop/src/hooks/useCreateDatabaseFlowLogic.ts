import { useState, useEffect, useRef } from "react"
import { api } from "../lib/api"
import { useEnvironmentStore } from "../stores/environmentStore"
import { useWorkspaceStore } from "../stores/workspaceStore"
import type { DBType, Dataset } from "@sqlose/shared"

type FlowStep = "select-type" | "configure" | "provisioning"

interface ProvisioningStep {
   id: string
   label: string
   status: "pending" | "in-progress" | "done" | "error"
   message?: string
}

export function useCreateDatabaseFlowLogic(_onClose: () => void) {
   const [step, setStep] = useState<FlowStep>("select-type")
   const [selectedDbType, setSelectedDbType] = useState<DBType | null>(null)
   const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
   const [dbName, setDbName] = useState("")
   const [provisioningSteps, setProvisioningSteps] = useState<ProvisioningStep[]>([])
   const [provisioningError, setProvisioningError] = useState<string | null>(null)
   const [datasets, setDatasets] = useState<Dataset[]>([])
   const [datasetsLoading, setDatasetsLoading] = useState(false)
   const [creating, setCreating] = useState(false)

   const provisionStarted = useRef(false)

   const createEnvironment = useEnvironmentStore(s => s.createEnvironment)
   const selectEnvironment = useEnvironmentStore(s => s.selectEnvironment)
   const resetWorkspace = useWorkspaceStore(s => s.resetWorkspace)

   const DB_CARDS = [
      { type: "postgres" as DBType, label: "PostgreSQL" },
      { type: "mysql" as DBType, label: "MySQL" },
      { type: "sqlite" as DBType, label: "SQLite" },
   ]

   useEffect(() => {
      if (step === "configure") {
         setDatasetsLoading(true)
         api.dataset.list().then(result => {
            if (result.isOk()) {
               setDatasets(result.value)
            }
            setDatasetsLoading(false)
         })
      }
   }, [step])

   const updateStepStatus = (id: string, status: ProvisioningStep["status"], message?: string) => {
      setProvisioningSteps(prev => prev.map(s => (s.id === id ? { ...s, status, message } : s)))
   }

   const runProvision = async () => {
      const steps: ProvisioningStep[] = []
      steps.push({ id: "create", label: "Creating environment", status: "pending" })
      if (selectedDbType === "sqlite") {
         steps.push({ id: "init", label: "Initializing database", status: "pending" })
      } else {
         steps.push({ id: "pull", label: "Pulling database container", status: "pending" })
         steps.push({ id: "start", label: "Starting database server", status: "pending" })
      }
      if (selectedDataset) {
         steps.push({
            id: "seed",
            label: `Importing ${selectedDataset.name} dataset`,
            status: "pending",
         })
      }
      steps.push({ id: "connect", label: "Connecting client", status: "pending" })
      setProvisioningSteps(steps)

      updateStepStatus("create", "in-progress")
      const cardLabel = DB_CARDS.find(c => c.type === selectedDbType)?.label ?? selectedDbType
      const envResult = await createEnvironment(selectedDbType!, dbName || `${cardLabel} Database`)
      if (envResult.isErr()) {
         updateStepStatus("create", "error", envResult.error.message)
         setProvisioningError(envResult.error.message)
         return
      }
      const env = envResult.value
      updateStepStatus("create", "done")

      if (selectedDbType === "sqlite") {
         updateStepStatus("init", "done")
      } else {
         updateStepStatus("pull", "in-progress")
         const pullResult = await api.docker.pullImage(selectedDbType!)
         if (pullResult.isErr()) {
            updateStepStatus("pull", "error", pullResult.error.message)
            setProvisioningError(pullResult.error.message)
            return
         }
         updateStepStatus("pull", "done")

         updateStepStatus("start", "in-progress")
         const containerResult = await api.docker.createContainer(env.id)
         if (containerResult.isErr()) {
            updateStepStatus("start", "error", containerResult.error.message)
            setProvisioningError(containerResult.error.message)
            return
         }
         updateStepStatus("start", "done")
      }

      if (selectedDataset) {
         updateStepStatus("seed", "in-progress")
         const importResult = await api.dataset.import(selectedDataset.id, env.id)
         if (importResult.isErr()) {
            updateStepStatus("seed", "error", importResult.error.message)
            setProvisioningError(importResult.error.message)
            return
         }
         updateStepStatus("seed", "done")
      }

      updateStepStatus("connect", "in-progress")
      await new Promise(r => setTimeout(r, 300))
      resetWorkspace()
      selectEnvironment(env.id)
      updateStepStatus("connect", "done")
   }

   useEffect(() => {
      if (step === "provisioning" && !provisionStarted.current) {
         provisionStarted.current = true
         runProvision()
      }
   }, [step])

   const handleSelectType = (type: DBType) => {
      setSelectedDbType(type)
      const cardLabel = DB_CARDS.find(c => c.type === type)?.label ?? type
      setDbName(`${cardLabel} Database`)
      setStep("configure")
   }

   const handleCreate = () => {
      setCreating(true)
      setStep("provisioning")
   }

   const allDone = provisioningSteps.length > 0 && provisioningSteps.every(s => s.status === "done")

   return {
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
   }
}
