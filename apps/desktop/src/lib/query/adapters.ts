import { type Result } from "neverthrow"
import { AppError } from "@sqlose/shared"

export function unwrapResult<T>(result: Result<T, AppError>): T {
   if (result.isErr()) throw result.error
   return result.value
}

export async function unwrapAsyncResult<T>(promise: Promise<Result<T, AppError>>): Promise<T> {
   const result = await promise
   return unwrapResult(result)
}

export class QueryError extends Error {
   public readonly code: string
   public readonly appError: AppError

   constructor(appError: AppError) {
      super(appError.message)
      this.name = "QueryError"
      this.code = appError.code
      this.appError = appError
   }

   static fromError(error: unknown): QueryError {
      if (error instanceof AppError) return new QueryError(error)

      if (error instanceof QueryError) return error
      if (error instanceof Error)
         return new QueryError(new AppError("ipc:invalid_payload", error.message))

      return new QueryError(new AppError("ipc:invalid_payload", String(error)))
   }
}
