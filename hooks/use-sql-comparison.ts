"use client"

import { useState } from "react"
import { SQLParser } from "@/lib/sql-parser"
import { AlterGenerator, type AlterStatement } from "@/lib/alter-generator"

interface UseSQLComparisonReturn {
  oldSchema: string
  newSchema: string
  alterStatements: string
  isLoading: boolean
  error: string
  success: string
  statements: AlterStatement[]
  setOldSchema: (value: string) => void
  setNewSchema: (value: string) => void
  generateAlterStatements: () => Promise<void>
  clearMessages: () => void
}

export function useSQLComparison(): UseSQLComparisonReturn {
  const [oldSchema, setOldSchema] = useState("")
  const [newSchema, setNewSchema] = useState("")
  const [alterStatements, setAlterStatements] = useState("")
  const [statements, setStatements] = useState<AlterStatement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const clearMessages = () => {
    setError("")
    setSuccess("")
  }

  const generateAlterStatements = async () => {
    setIsLoading(true)
    clearMessages()
    setAlterStatements("")
    setStatements([])

    if (!oldSchema.trim() || !newSchema.trim()) {
      setError("Please provide both original and new CREATE TABLE scripts")
      setIsLoading(false)
      return
    }

    try {
      const oldParsed = SQLParser.parseCreateTable(oldSchema)
      const newParsed = SQLParser.parseCreateTable(newSchema)

      const generatedStatements = AlterGenerator.generateAlterStatements(oldParsed, newParsed)
      const formattedStatements = AlterGenerator.formatStatements(generatedStatements)
      const summary = AlterGenerator.getChangesSummary(generatedStatements)

      setStatements(generatedStatements)
      setAlterStatements(formattedStatements)
      setSuccess(summary)
    } catch (err) {
      setError(`Error parsing SQL: ${err instanceof Error ? err.message : "Unknown error"}`)
    }

    setIsLoading(false)
  }

  return {
    oldSchema,
    newSchema,
    alterStatements,
    isLoading,
    error,
    success,
    statements,
    setOldSchema,
    setNewSchema,
    generateAlterStatements,
    clearMessages,
  }
}
