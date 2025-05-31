import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

interface StatusMessagesProps {
  error?: string
  success?: string
}

export function StatusMessages({ error, success }: StatusMessagesProps) {
  if (!error && !success) return null

  return (
    <div className="space-y-4">
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
    </div>
  )
}
