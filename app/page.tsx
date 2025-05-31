"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Zap, Code } from "lucide-react"
import { useSQLComparison } from "@/hooks/use-sql-comparison"
import { SQLEditor } from "@/components/sql-editor"
import { StatusMessages } from "@/components/status-messages"
import { OutputSection } from "@/components/output-section"
import { Title } from "@/components/ui/title" // Import Title component

export default function MySQLAlterGenerator() {
  const {
    oldSchema,
    newSchema,
    alterStatements,
    isLoading,
    error,
    success,
    setOldSchema,
    setNewSchema,
    generateAlterStatements,
  } = useSQLComparison()

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
            <Title className="text-white flex items-center gap-2">
              <Code className="w-5 h-5" />
              SQL Schema Comparison
            </Title>
            <CardDescription className="text-gray-400">
              Paste your original and new CREATE TABLE scripts below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <SQLEditor
                value={oldSchema}
                onChange={setOldSchema}
                label="Original Schema"
                placeholder={`Paste your original CREATE TABLE script here...

Example:
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE
);`}
              />

              <SQLEditor
                value={newSchema}
                onChange={setNewSchema}
                label="New Schema"
                placeholder={`Paste your new CREATE TABLE script here...

Example:
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}
              />
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

            {/* Status Messages */}
            <StatusMessages error={error} success={success} />

            {/* Output Section */}
            <OutputSection alterStatements={alterStatements} />
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
