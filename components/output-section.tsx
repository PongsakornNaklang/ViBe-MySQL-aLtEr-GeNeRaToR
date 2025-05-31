"use client"

import { Button } from "@/components/ui/button"
import { Copy, Code } from "lucide-react"
import { SQLEditor } from "./sql-editor"
import { useClipboard } from "@/hooks/use-clipboard"

interface OutputSectionProps {
  alterStatements: string
}

export function OutputSection({ alterStatements }: OutputSectionProps) {
  const { copyToClipboard } = useClipboard()

  if (!alterStatements) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Code className="w-5 h-5" />
          Generated ALTER Statements
        </h3>
        <Button
          onClick={() => copyToClipboard(alterStatements)}
          variant="outline"
          size="sm"
          className="bg-gray-900/20 border-gray-700/50 text-gray-300 hover:bg-gray-800/30"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </Button>
      </div>
      <SQLEditor
        value={alterStatements}
        onChange={() => {}} // Read-only
        label=""
        placeholder=""
        height="200px"
        readOnly
      />
    </div>
  )
}
