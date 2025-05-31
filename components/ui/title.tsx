import * as React from "react"

import { cn } from "@/lib/utils"

export interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const Title = React.forwardRef<HTMLHeadingElement, TitleProps>(({ className, ...props }, ref) => {
  return <h2 className={cn("scroll-m-20 text-3xl font-semibold tracking-tight", className)} ref={ref} {...props} />
})
Title.displayName = "Title"
