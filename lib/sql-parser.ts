export interface ParsedSchema {
  tableName: string
  columns: Record<string, string>
  constraints: string[]
}

export class SQLParser {
  static parseCreateTable(sql: string): ParsedSchema {
    const columns: Record<string, string> = {}
    const constraints: string[] = []

    // Clean SQL
    sql = sql.replace(/\s+/g, " ").trim()

    // Find table name
    const tableMatch = sql.match(/CREATE\s+TABLE\s+`?(\w+)`?\s*\(/i)
    const tableName = tableMatch ? tableMatch[1] : "unknown"

    // Find columns and constraints
    const contentMatch = sql.match(/$$(.*)$$/s)
    if (!contentMatch) return { tableName, columns, constraints }

    const content = contentMatch[1]
    const items = this.parseTableContent(content)

    for (let item of items) {
      item = item.trim()
      if (!item) continue

      if (this.isConstraint(item)) {
        constraints.push(item)
      } else {
        const columnData = this.parseColumnDefinition(item)
        if (columnData) {
          columns[columnData.name] = columnData.definition
        }
      }
    }

    return { tableName, columns, constraints }
  }

  private static parseTableContent(content: string): string[] {
    const items: string[] = []
    let current = ""
    let parenCount = 0

    for (const char of content) {
      if (char === "(") parenCount++
      if (char === ")") parenCount--

      if (char === "," && parenCount === 0) {
        items.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    items.push(current.trim())
    return items
  }

  private static isConstraint(item: string): boolean {
    const constraintKeywords = ["PRIMARY KEY", "UNIQUE", "KEY", "INDEX", "FOREIGN KEY", "CONSTRAINT"]

    return constraintKeywords.some((keyword) => item.toUpperCase().startsWith(keyword))
  }

  private static parseColumnDefinition(item: string): { name: string; definition: string } | null {
    const parts = item.match(/^`?(\w+)`?\s+(.+)$/)
    if (parts) {
      return {
        name: parts[1],
        definition: parts[2],
      }
    }
    return null
  }
}
