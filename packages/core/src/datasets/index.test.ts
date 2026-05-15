import { describe, it, expect } from "vitest"
import { ImportError } from "@sqlose/shared"
import { listDatasets, getDatasetSQL, SAMPLE_DATASETS } from "./index"

describe("Sample Datasets", () => {
   describe("listDatasets", () => {
      it("should return all sample datasets", async () => {
         const result = await listDatasets()

         expect(result.isOk()).toBe(true)
         if (result.isOk()) {
            expect(result.value).toHaveLength(4)
            const categories = result.value.map(d => d.category)
            expect(categories).toContain("ecommerce")
            expect(categories).toContain("analytics")
            expect(categories).toContain("social")
            expect(categories).toContain("finance")
         }
      })

      it("should have all required fields for each dataset", async () => {
         const result = await listDatasets()
         if (result.isOk()) {
            for (const ds of result.value) {
               expect(ds.id).toBeTruthy()
               expect(ds.name).toBeTruthy()
               expect(ds.description).toBeTruthy()
               expect(ds.category).toBeTruthy()
               expect(ds.dbTypes).toContain("sqlite")
            }
         }
      })
   })

   describe("getDatasetSQL", () => {
      it("should return SQL for valid dataset ids", async () => {
         for (const id of Object.keys(SAMPLE_DATASETS)) {
            const result = await getDatasetSQL(id)
            expect(result.isOk()).toBe(true)
            if (result.isOk()) {
               expect(result.value).toContain("CREATE TABLE")
               expect(result.value).toContain("INSERT INTO")
            }
         }
      })

      it("should return ImportError for unknown dataset", async () => {
         const result = await getDatasetSQL("nonexistent")

         expect(result.isErr()).toBe(true)
         if (result.isErr()) {
            expect(result.error).toBeInstanceOf(ImportError)
            expect(result.error.code).toBe("import:parse_failed")
         }
      })

      it("should have four sample datasets defined", () => {
         expect(Object.keys(SAMPLE_DATASETS)).toHaveLength(4)
         expect(SAMPLE_DATASETS["ds-ecommerce"]).toBeTruthy()
         expect(SAMPLE_DATASETS["ds-analytics"]).toBeTruthy()
         expect(SAMPLE_DATASETS["ds-social"]).toBeTruthy()
         expect(SAMPLE_DATASETS["ds-finance"]).toBeTruthy()
      })
   })
})
