import type { ParsedSchema } from "./sql-parser"

export interface AlterStatement {
  type: "ADD" | "MODIFY" | "DROP"
  column: string
  definition?: string
  statement: string
}

export class AlterGenerator {
  static generateAlterStatements(oldSchema: ParsedSchema, newSchema: ParsedSchema): AlterStatement[] {
    if (oldSchema.tableName !== newSchema.tableName) {
      throw new Error(`Table names don't match: ${oldSchema.tableName} vs ${newSchema.tableName}`)
    }

    const statements: AlterStatement[] = []
    const tableName = oldSchema.tableName

    // Check for modified and new columns
    for (const [columnName, newDef] of Object.entries(newSchema.columns)) {
      if (oldSchema.columns[columnName]) {
        // Column exists - check if modified
        if (oldSchema.columns[columnName] !== newDef) {
          statements.push({
            type: "MODIFY",
            column: columnName,
            definition: newDef,
            statement: `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` ${newDef};`,
          })
        }
      } else {
        // New column
        statements.push({
          type: "ADD",
          column: columnName,
          definition: newDef,
          statement: `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${newDef};`,
        })
      }
    }

    // Check for dropped columns
    for (const columnName of Object.keys(oldSchema.columns)) {
      if (!newSchema.columns[columnName]) {
        statements.push({
          type: "DROP",
          column: columnName,
          statement: `ALTER TABLE \`${tableName}\` DROP COLUMN \`${columnName}\`;`,
        })
      }
    }

    return statements
  }

  static formatStatements(statements: AlterStatement[]): string {
    if (statements.length === 0) {
      return "-- No changes detected\n-- Both tables have identical structure"
    }

    return statements.map((stmt) => stmt.statement).join("\n\n")
  }

  static getChangesSummary(statements: AlterStatement[]): string {
    if (statements.length === 0) {
      return "Analysis complete! No changes found between the two schemas."
    }

    const addCount = statements.filter((s) => s.type === "ADD").length
    const modifyCount = statements.filter((s) => s.type === "MODIFY").length
    const dropCount = statements.filter((s) => s.type === "DROP").length

    const parts = []
    if (addCount > 0) parts.push(`${addCount} column${addCount > 1 ? "s" : ""} added`)
    if (modifyCount > 0) parts.push(`${modifyCount} column${modifyCount > 1 ? "s" : ""} modified`)
    if (dropCount > 0) parts.push(`${dropCount} column${dropCount > 1 ? "s" : ""} dropped`)

    return `Successfully generated ${statements.length} ALTER TABLE statement${statements.length > 1 ? "s" : ""}! (${parts.join(", ")})`
  }
}
