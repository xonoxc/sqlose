export const queryKeys = {
   all: ["sqlose"] as const,

   environments: {
      all: ["sqlose", "environments"] as const,
      list: () => [...queryKeys.environments.all, "list"] as const,
      detail: (id: string) => [...queryKeys.environments.all, "detail", id] as const,
      health: (id: string) => [...queryKeys.environments.all, "health", id] as const,
   },

   datasets: {
      all: ["sqlose", "datasets"] as const,
      list: () => [...queryKeys.datasets.all, "list"] as const,
   },

   query: {
      all: ["sqlose", "query"] as const,
      result: (environmentId: string, queryHash: string) =>
         [...queryKeys.query.all, "result", environmentId, queryHash] as const,
   },

   import: {
      all: ["sqlose", "import"] as const,
      preview: (contentHash: string) => [...queryKeys.import.all, "preview", contentHash] as const,
   },
}
