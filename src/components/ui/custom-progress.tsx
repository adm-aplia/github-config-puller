import * as React from "react"
import { cn } from "@/lib/utils"

interface CustomProgressProps {
  value?: number
  className?: string
}

const CustomProgress = React.forwardRef<HTMLDivElement, CustomProgressProps>(
  ({ value = 0, className }, ref) => {
    // Garantir que o valor esteja entre 0 e 100
    const clampedValue = Math.min(Math.max(value, 0), 100);
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ 
            width: `${clampedValue}%`,
            transform: `translateX(0%)` // Força o posicionamento correto
          }}
        />
      </div>
    )
  }
)

CustomProgress.displayName = "CustomProgress"

export { CustomProgress }