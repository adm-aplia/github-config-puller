import React from 'react';
import { Circle, CheckCircle2 } from 'lucide-react';
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
  const getStepIcon = (step: Step) => {
    if (step.completed && step.number !== currentStep) {
      return <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
    if (step.number === currentStep) {
      return <Circle className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />;
    }
    return <Circle className="w-4 h-4 sm:w-5 sm:h-5" />;
  };

  return (
    <div className="w-full">
      {/* Botões Horizontais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.completed && step.number !== currentStep;
          const isNavigable = canNavigateToStep(step.number);
          const isFuture = !step.completed && step.number !== currentStep;

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => isNavigable && onStepClick(step.number)}
              disabled={!isNavigable}
              className={cn(
                "relative flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2",
                
                // Etapa Ativa
                isActive && [
                  "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))]/90",
                  "text-primary-foreground shadow-lg shadow-primary/40",
                  "scale-102 ring-2 ring-primary/30",
                  "animate-pulse-subtle"
                ],
                
                // Etapa Completa
                isCompleted && [
                  "bg-emerald-50 dark:bg-emerald-950/30",
                  "border-2 border-emerald-500",
                  "text-emerald-700 dark:text-emerald-400",
                  isNavigable && "hover:bg-emerald-100 dark:hover:bg-emerald-950/50 hover:scale-105 cursor-pointer"
                ],
                
                // Etapa Futura (Desabilitada)
                isFuture && [
                  "bg-muted/50 border-2 border-border/50",
                  "text-muted-foreground/60",
                  "cursor-not-allowed opacity-60"
                ],
                
                // Foco
                "focus:ring-primary"
              )}
            >
              {/* Ícone */}
              <span className="flex-shrink-0">
                {getStepIcon(step)}
              </span>

              {/* Texto */}
              <span className="truncate text-xs sm:text-sm">
                {step.title}
              </span>

              {/* Badge de Número (opcional, só em mobile) */}
              <span className={cn(
                "absolute -top-2 -left-2 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold sm:hidden",
                isActive && "bg-primary-foreground text-primary",
                isCompleted && "bg-emerald-500 text-white",
                isFuture && "bg-muted text-muted-foreground"
              )}>
                {step.number}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
