import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  title: string;
  completed: boolean;
}

interface ClickableStepIndicatorProps {
  currentStep: number;
  steps: Step[];
  onStepClick: (step: number) => void;
  canNavigateToStep: (step: number) => boolean;
}

export const ClickableStepIndicator: React.FC<ClickableStepIndicatorProps> = ({
  currentStep,
  steps,
  onStepClick,
  canNavigateToStep
}) => {
  return (
    <div className="space-y-4">
      {/* Progress Bar com Círculos */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 px-2 sm:px-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <button
              type="button"
              onClick={() => canNavigateToStep(step.number) && onStepClick(step.number)}
              disabled={!canNavigateToStep(step.number)}
              className={cn(
                "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full text-sm sm:text-lg font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2",
                step.number === currentStep && "bg-primary text-primary-foreground shadow-lg scale-110 focus:ring-primary",
                step.completed && step.number !== currentStep && "bg-primary/10 border-2 border-primary text-primary",
                !step.completed && step.number !== currentStep && "bg-muted border-2 border-border text-muted-foreground",
                canNavigateToStep(step.number) && step.number !== currentStep && "cursor-pointer hover:scale-105 hover:border-primary/50"
              )}
            >
              {step.completed && step.number !== currentStep ? (
                <Check className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                step.number
              )}
            </button>
            
            {index < steps.length - 1 && (
              <div className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                step.completed ? "bg-primary" : "bg-border"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Títulos das Etapas */}
      <div className="grid grid-cols-4 gap-1 text-center">
        {steps.map((step) => (
          <div key={step.number} className="space-y-1">
            <div className={cn(
              "text-[10px] sm:text-xs font-medium transition-colors px-1",
              step.number === currentStep ? "text-primary" : "text-muted-foreground"
            )}>
              {step.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
