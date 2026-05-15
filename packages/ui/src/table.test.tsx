import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
   Table,
   TableHeader,
   TableBody,
   TableRow,
   TableHead,
   TableCell,
   TableCaption,
} from "./table"

describe("Table", () => {
   it("renders table with headers and cells", () => {
      render(
         <Table>
            <TableHeader>
               <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               <TableRow>
                  <TableCell>Alice</TableCell>
                  <TableCell>alice@example.com</TableCell>
               </TableRow>
            </TableBody>
            <TableCaption>User list</TableCaption>
         </Table>
      )

      expect(screen.getByText("Name")).toBeInTheDocument()
      expect(screen.getByText("Email")).toBeInTheDocument()
      expect(screen.getByText("Alice")).toBeInTheDocument()
      expect(screen.getByText("alice@example.com")).toBeInTheDocument()
      expect(screen.getByText("User list")).toBeInTheDocument()
   })

   it("applies custom className to the table element", () => {
      render(
         <Table className="custom-class">
            <TableBody>
               <TableRow>
                  <TableCell>Test</TableCell>
               </TableRow>
            </TableBody>
         </Table>
      )
      const table = screen.getByRole("table")
      expect(table.className).toContain("custom-class")
   })
})
