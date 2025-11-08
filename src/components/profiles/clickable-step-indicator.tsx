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
      return <CheckCircle2 className="w-5 h-5" />;
    }
    if (step.number === currentStep) {
      return <Circle className="w-5 h-5 fill-current" />;
    }
    return <Circle className="w-5 h-5" />;
  };

  return (
    <div className="w-full">
      {/* Botões Horizontais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                "relative flex items-center justify-center gap-2 px-3 py-3",
                "font-semibold text-sm transition-all duration-300",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                "border-2 rounded-lg",
                
                // Etapa Ativa - Vermelho Suave
                isActive && [
                  "bg-red-50 dark:bg-red-950/20",
                  "text-red-700 dark:text-red-400",
                  "border-red-500",
                  "shadow-sm",
                ],
                
                // Etapa Completa - Verde Suave
                isCompleted && [
                  "bg-emerald-50 dark:bg-emerald-950/20",
                  "text-emerald-700 dark:text-emerald-400",
                  "border-emerald-500",
                  isNavigable && "hover:bg-emerald-100 dark:hover:bg-emerald-950/30 cursor-pointer"
                ],
                
                // Etapa Futura/Navegável - Cinza Claro
                isFuture && [
                  isNavigable 
                    ? "bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900/30 cursor-pointer" 
                    : "bg-gray-50 dark:bg-gray-900/20 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-50"
                ],
                
                "focus:ring-red-500"
              )}
            >
              {/* Ícone */}
              <span className="flex-shrink-0">
                {getStepIcon(step)}
              </span>

              {/* Texto - SEM truncate, permite quebra de linha */}
              <span className="text-xs sm:text-sm text-center leading-tight">
                {step.title}
              </span>

              {/* Badge de Número Mobile */}
              <span className={cn(
                "absolute -top-2 -left-2 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold sm:hidden",
                isActive && "bg-red-500 text-white",
                isCompleted && "bg-emerald-500 text-white",
                isFuture && (isNavigable ? "bg-gray-300 text-gray-700" : "bg-gray-200 text-gray-400")
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
