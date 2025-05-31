"use client"

import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

interface SQLEditorProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder: string
  height?: string
  readOnly?: boolean
}

export function SQLEditor({ value, onChange, label, placeholder, height = "300px", readOnly = false }: SQLEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-gray-900/50 text-gray-300 border-gray-700">
          {label}
        </Badge>
      </div>
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`
            font-mono text-sm resize-none
            bg-gray-900/50 backdrop-blur-sm border-gray-700 
            text-gray-100 placeholder:text-gray-400
            focus:border-gray-500 focus:ring-1 focus:ring-gray-500
            ${readOnly ? "cursor-default" : "cursor-text"}
          `}
          style={{ height }}
          spellCheck={false}
        />
      </div>
    </div>
  )
}
