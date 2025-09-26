import * as React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ToggleWithInputProps {
  label: string;
  toggleValue: boolean;
  onToggleChange: (value: boolean) => void;
  inputValue?: string | number;
  onInputChange?: (value: string) => void;
  inputPlaceholder?: string;
  inputType?: "text" | "number";
  className?: string;
  disabled?: boolean;
}

export const ToggleWithInput: React.FC<ToggleWithInputProps> = ({
  label,
  toggleValue,
  onToggleChange,
  inputValue,
  onInputChange,
  inputPlaceholder,
  inputType = "text",
  className,
  disabled = false
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center space-x-2">
        <Switch
          id={`toggle-${label}`}
          checked={toggleValue}
          onCheckedChange={onToggleChange}
          disabled={disabled}
        />
        <Label 
          htmlFor={`toggle-${label}`}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </Label>
      </div>
      
      {toggleValue && (
        <div className="ml-6">
          <Input
            type={inputType}
            value={inputValue || ""}
            onChange={(e) => onInputChange?.(e.target.value)}
            placeholder={inputPlaceholder}
            disabled={disabled}
            className="w-32"
          />
        </div>
      )}
    </div>
  );
};