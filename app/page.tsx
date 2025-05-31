"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Copy, Database, Zap, CheckCircle, AlertCircle, Code } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import dynamic from "next/dynamic"

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[300px] bg-slate-900/50 border border-slate-600 rounded-md flex items-center justify-center">
      <div className="flex items-center gap-2 text-slate-400">
        <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
        Loading editor...
      </div>
    </div>
  ),
})

interface ParsedSchema {
  tableName: string
  columns: Record<string, string>
  constraints: string[]
}

export default function MySQLAlterGenerator() {
  const [oldSchema, setOldSchema] = useState("")
  const [newSchema, setNewSchema] = useState("")
  const [alterStatements, setAlterStatements] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { toast } = useToast()

  const parseCreateTable = (sql: string): ParsedSchema => {
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

    for (let item of items) {
      item = item.trim()
      if (!item) continue

      // Check if it's a constraint
      if (
        item.toUpperCase().startsWith("PRIMARY KEY") ||
        item.toUpperCase().startsWith("UNIQUE") ||
        item.toUpperCase().startsWith("KEY") ||
        item.toUpperCase().startsWith("INDEX") ||
        item.toUpperCase().startsWith("FOREIGN KEY") ||
        item.toUpperCase().startsWith("CONSTRAINT")
      ) {
        constraints.push(item)
      } else {
        // It's a column definition
        const parts = item.match(/^`?(\w+)`?\s+(.+)$/)
        if (parts) {
          const columnName = parts[1]
          const columnDef = parts[2]
          columns[columnName] = columnDef
        }
      }
    }

    return { tableName, columns, constraints }
  }

  const generateAlterStatements = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")
    setAlterStatements("")

    if (!oldSchema.trim() || !newSchema.trim()) {
      setError("Please provide both original and new CREATE TABLE scripts")
      setIsLoading(false)
      return
    }

    try {
      const oldParsed = parseCreateTable(oldSchema)
      const newParsed = parseCreateTable(newSchema)

      if (oldParsed.tableName !== newParsed.tableName) {
        setError(`Table names don't match: ${oldParsed.tableName} vs ${newParsed.tableName}`)
        setIsLoading(false)
        return
      }

      const statements: string[] = []
      const tableName = oldParsed.tableName

      // Check for modified columns
      for (const [columnName, newDef] of Object.entries(newParsed.columns)) {
        if (oldParsed.columns[columnName]) {
          // Column exists - check if modified
          if (oldParsed.columns[columnName] !== newDef) {
            statements.push(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` ${newDef};`)
          }
        } else {
          // New column
          statements.push(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${newDef};`)
        }
      }

      // Check for dropped columns
      for (const columnName of Object.keys(oldParsed.columns)) {
        if (!newParsed.columns[columnName]) {
          statements.push(`ALTER TABLE \`${tableName}\` DROP COLUMN \`${columnName}\`;`)
        }
      }

      if (statements.length === 0) {
        setAlterStatements("-- No changes detected\n-- Both tables have identical structure")
        setSuccess("Analysis complete! No changes found between the two schemas.")
      } else {
        setAlterStatements(statements.join("\n\n"))
        setSuccess(
          `Successfully generated ${statements.length} ALTER TABLE statement${statements.length > 1 ? "s" : ""}!`,
        )
      }
    } catch (err) {
      setError(`Error parsing SQL: ${err instanceof Error ? err.message : "Unknown error"}`)
    }

    setIsLoading(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(alterStatements)
      toast({
        title: "Copied!",
        description: "ALTER statements copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  // Replace all color-specific styling with black and white theme
  // Change the background gradient
  const bgGradient = "min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4"
  // Update this line
  //document.querySelector('.min-h-screen').className = bgGradient;

  // Replace the header styling
  const headerSection = `
<div className="text-center mb-8">
  <div className="inline-flex items-center gap-3 mb-4">
    <div className="p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
      <Database className="w-8 h-8 text-white" />
    </div>
    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
      MySQL ALTER Generator
    </h1>
  </div>
  <p className="text-gray-400 text-lg max-w-2xl mx-auto">
    Compare two CREATE TABLE scripts and automatically generate the necessary ALTER TABLE statements
  </p>
</div>`

  // Replace the main card styling
  const mainCard = `<Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">`

  // Replace the card header styling
  const cardHeader = `
<CardHeader>
  <CardTitle className="text-white flex items-center gap-2">
    <Code className="w-5 h-5" />
    SQL Schema Comparison
  </CardTitle>
  <CardDescription className="text-gray-400">
    Paste your original and new CREATE TABLE scripts below
  </CardDescription>
</CardHeader>`

  // Replace the badge styling for original schema
  const originalBadge = `
<Badge variant="outline" className="bg-gray-900/50 text-gray-300 border-gray-700">
  Original Schema
</Badge>`

  // Replace the badge styling for new schema
  const newBadge = `
<Badge variant="outline" className="bg-gray-900/50 text-gray-300 border-gray-700">
  New Schema
</Badge>`

  // Replace the editor container styling
  const editorContainer = `className="rounded-md overflow-hidden border border-gray-700 bg-gray-900/50 backdrop-blur-sm"`

  // Replace the generate button styling
  const generateButton = `
<Button
  onClick={generateAlterStatements}
  disabled={isLoading}
  size="lg"
  className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
>
  {isLoading ? (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      Analyzing...
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Zap className="w-5 h-5" />
      Generate ALTER Statements
    </div>
  )}
</Button>`

  // Replace the error alert styling
  const errorAlert = `
<Alert className="bg-gray-900/20 border-gray-700/50 backdrop-blur-sm">
  <AlertCircle className="h-4 w-4 text-gray-400" />
  <AlertDescription className="text-gray-300">{error}</AlertDescription>
</Alert>`

  // Replace the success alert styling
  const successAlert = `
<Alert className="bg-gray-900/20 border-gray-700/50 backdrop-blur-sm">
  <CheckCircle className="h-4 w-4 text-gray-400" />
  <AlertDescription className="text-gray-300">{success}</AlertDescription>
</Alert>`

  // Replace the output section header styling
  const outputHeader = `
<div className="flex items-center justify-between">
  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
    <Code className="w-5 h-5" />
    Generated ALTER Statements
  </h3>
  <Button
    onClick={copyToClipboard}
    variant="outline"
    size="sm"
    className="bg-gray-900/20 border-gray-700/50 text-gray-300 hover:bg-gray-800/30"
  >
    <Copy className="w-4 h-4 mr-2" />
    Copy
  </Button>
</div>`

  // Replace the example section styling
  const exampleCard = `<Card className="mt-8 bg-gray-900/20 backdrop-blur-md border-gray-700/30">`

  // Replace the example card header styling
  const exampleCardHeader = `
<CardHeader>
  <CardTitle className="text-gray-300 flex items-center gap-2">💡 Usage Example</CardTitle>
  <CardDescription className="text-gray-400">
    Here's how to use the ALTER TABLE generator effectively
  </CardDescription>
</CardHeader>`

  // Replace the example content styling
  const exampleContent = `
<div className="space-y-4">
  <p className="text-gray-300">
    Input your original and new CREATE TABLE scripts, then click generate to automatically create ALTER
    TABLE statements.
  </p>
  <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
    <pre className="text-gray-300 font-mono text-sm overflow-x-auto">
      {\`-- Example Original Script
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    price DECIMAL(10,2)
);

-- Example New Script  
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(12,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);\`}
    </pre>
  </div>
</div>`

  // Replace all color-specific classes in the entire file
  const entireFile = `
<div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              MySQL ALTER Generator
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Compare two CREATE TABLE scripts and automatically generate the necessary ALTER TABLE statements
          </p>
        </div>

        {/* Main Content */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Code className="w-5 h-5" />
              SQL Schema Comparison
            </CardTitle>
            <CardDescription className="text-gray-400">
              Paste your original and new CREATE TABLE scripts below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-gray-900/50 text-gray-300 border-gray-700">
                    Original Schema
                  </Badge>
                </div>
                <div className="relative">
                  <MonacoEditor
                    height="300px"
                    language="sql"
                    theme="vs-dark"
                    value={oldSchema}
                    onChange={(value) => setOldSchema(value || "")}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                      lineNumbers: "on",
                      roundedSelection: false,
                      scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                      },
                      suggest: {
                        showKeywords: true,
                        showSnippets: true,
                      },
                      wordWrap: "on",
                      automaticLayout: true,
                      padding: { top: 16, bottom: 16 },
                      bracketPairColorization: { enabled: true },
                      renderLineHighlight: "line",
                      cursorBlinking: "smooth",
                      smoothScrolling: true,
                    }}
                    className="rounded-md overflow-hidden border border-gray-700 bg-gray-900/50 backdrop-blur-sm"
                  />
                  {!oldSchema && (
                    <div className="absolute top-4 left-4 pointer-events-none text-gray-400 text-sm font-mono">
                      {\`Paste your original CREATE TABLE script here...

Example:
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE
);\`}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-gray-900/50 text-gray-300 border-gray-700">
                    New Schema
                  </Badge>
                </div>
                <div className="relative">
                  <MonacoEditor
                    height="300px"
                    language="sql"
                    theme="vs-dark"
                    value={newSchema}
                    onChange={(value) => setNewSchema(value || "")}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                      lineNumbers: "on",
                      roundedSelection: false,
                      scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                      },
                      suggest: {
                        showKeywords: true,
                        showSnippets: true,
                      },
                      wordWrap: "on",
                      automaticLayout: true,
                      padding: { top: 16, bottom: 16 },
                      bracketPairColorization: { enabled: true },
                      renderLineHighlight: "line",
                      cursorBlinking: "smooth",
                      smoothScrolling: true,
                    }}
                    className="rounded-md overflow-hidden border border-gray-700 bg-gray-900/50 backdrop-blur-sm"
                  />
                  {!newSchema && (
                    <div className="absolute top-4 left-4 pointer-events-none text-gray-400 text-sm font-mono">
                      {\`Paste your new CREATE TABLE script here...

Example:
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);\`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                onClick={generateAlterStatements}
                disabled={isLoading}
                size="lg"
                className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Generate ALTER Statements
                  </div>
                )}
              </Button>
            </div>

            {/* Messages */}
            {error && (
              <Alert className="bg-gray-900/20 border-gray-700/50 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 text-gray-400" />
                <AlertDescription className="text-gray-300">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-gray-900/20 border-gray-700/50 backdrop-blur-sm">
                <CheckCircle className="h-4 w-4 text-gray-400" />
                <AlertDescription className="text-gray-300">{success}</AlertDescription>
              </Alert>
            )}

            {/* Output Section */}
            {alterStatements && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Generated ALTER Statements
                  </h3>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="bg-gray-900/20 border-gray-700/50 text-gray-300 hover:bg-gray-800/30"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="rounded-lg overflow-hidden border border-gray-700">
                  <MonacoEditor
                    height="200px"
                    language="sql"
                    theme="vs-dark"
                    value={alterStatements}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                      lineNumbers: "on",
                      scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                      },
                      wordWrap: "on",
                      automaticLayout: true,
                      padding: { top: 16, bottom: 16 },
                      bracketPairColorization: { enabled: true },
                      renderLineHighlight: "none",
                      contextmenu: false,
                      selectOnLineNumbers: false,
                    }}
                    className="bg-gray-900/70 backdrop-blur-sm"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Example Section */}
        <Card className="mt-8 bg-gray-900/20 backdrop-blur-md border-gray-700/30">
          <CardHeader>
            <CardTitle className="text-gray-300 flex items-center gap-2">💡 Usage Example</CardTitle>
            <CardDescription className="text-gray-400">
              Here's how to use the ALTER TABLE generator effectively
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-300">
                Input your original and new CREATE TABLE scripts, then click generate to automatically create ALTER
                TABLE statements.
              </p>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
                <pre className="text-gray-300 font-mono text-sm overflow-x-auto">
                  {\`-- Example Original Script
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    price DECIMAL(10,2)
);

-- Example New Script  
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(12,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);\`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  `

  // Return the updated file content
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              MySQL ALTER Generator
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Compare two CREATE TABLE scripts and automatically generate the necessary ALTER TABLE statements
          </p>
        </div>

        {/* Main Content */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Code className="w-5 h-5" />
              SQL Schema Comparison
            </CardTitle>
            <CardDescription className="text-gray-400">
              Paste your original and new CREATE TABLE scripts below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-gray-900/50 text-gray-300 border-gray-700">
                    Original Schema
                  </Badge>
                </div>
                <div className="relative">
                  <MonacoEditor
                    height="300px"
                    language="sql"
                    theme="vs-dark"
                    value={oldSchema}
                    onChange={(value) => setOldSchema(value || "")}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                      lineNumbers: "on",
                      roundedSelection: false,
                      scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                      },
                      suggest: {
                        showKeywords: true,
                        showSnippets: true,
                      },
                      wordWrap: "on",
                      automaticLayout: true,
                      padding: { top: 16, bottom: 16 },
                      bracketPairColorization: { enabled: true },
                      renderLineHighlight: "line",
                      cursorBlinking: "smooth",
                      smoothScrolling: true,
                    }}
                    className="rounded-md overflow-hidden border border-gray-700 bg-gray-900/50 backdrop-blur-sm"
                  />
                  {!oldSchema && (
                    <div className="absolute top-4 left-4 pointer-events-none text-gray-400 text-sm font-mono">
                      {`Paste your original CREATE TABLE script here...

Example:
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE
);`}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-gray-900/50 text-gray-300 border-gray-700">
                    New Schema
                  </Badge>
                </div>
                <div className="relative">
                  <MonacoEditor
                    height="300px"
                    language="sql"
                    theme="vs-dark"
                    value={newSchema}
                    onChange={(value) => setNewSchema(value || "")}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                      lineNumbers: "on",
                      roundedSelection: false,
                      scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                      },
                      suggest: {
                        showKeywords: true,
                        showSnippets: true,
                      },
                      wordWrap: "on",
                      automaticLayout: true,
                      padding: { top: 16, bottom: 16 },
                      bracketPairColorization: { enabled: true },
                      renderLineHighlight: "line",
                      cursorBlinking: "smooth",
                      smoothScrolling: true,
                    }}
                    className="rounded-md overflow-hidden border border-gray-700 bg-gray-900/50 backdrop-blur-sm"
                  />
                  {!newSchema && (
                    <div className="absolute top-4 left-4 pointer-events-none text-gray-400 text-sm font-mono">
                      {`Paste your new CREATE TABLE script here...

Example:
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                onClick={generateAlterStatements}
                disabled={isLoading}
                size="lg"
                className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Generate ALTER Statements
                  </div>
                )}
              </Button>
            </div>

            {/* Messages */}
            {error && (
              <Alert className="bg-gray-900/20 border-gray-700/50 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 text-gray-400" />
                <AlertDescription className="text-gray-300">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-gray-900/20 border-gray-700/50 backdrop-blur-sm">
                <CheckCircle className="h-4 w-4 text-gray-400" />
                <AlertDescription className="text-gray-300">{success}</AlertDescription>
              </Alert>
            )}

            {/* Output Section */}
            {alterStatements && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Generated ALTER Statements
                  </h3>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="bg-gray-900/20 border-gray-700/50 text-gray-300 hover:bg-gray-800/30"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="rounded-lg overflow-hidden border border-gray-700">
                  <MonacoEditor
                    height="200px"
                    language="sql"
                    theme="vs-dark"
                    value={alterStatements}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                      lineNumbers: "on",
                      scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                      },
                      wordWrap: "on",
                      automaticLayout: true,
                      padding: { top: 16, bottom: 16 },
                      bracketPairColorization: { enabled: true },
                      renderLineHighlight: "none",
                      contextmenu: false,
                      selectOnLineNumbers: false,
                    }}
                    className="bg-gray-900/70 backdrop-blur-sm"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Example Section */}
        <Card className="mt-8 bg-gray-900/20 backdrop-blur-md border-gray-700/30">
          <CardHeader>
            <CardTitle className="text-gray-300 flex items-center gap-2">💡 Usage Example</CardTitle>
            <CardDescription className="text-gray-400">
              Here's how to use the ALTER TABLE generator effectively
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-300">
                Input your original and new CREATE TABLE scripts, then click generate to automatically create ALTER
                TABLE statements.
              </p>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
                <pre className="text-gray-300 font-mono text-sm overflow-x-auto">
                  {`-- Example Original Script
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    price DECIMAL(10,2)
);

-- Example New Script  
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(12,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
