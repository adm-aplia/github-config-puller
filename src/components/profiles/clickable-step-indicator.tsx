import React from 'react';
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
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {steps.map((step) => {
          const isActive = step.number === currentStep;
          const isNavigable = canNavigateToStep(step.number);

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => isNavigable && onStepClick(step.number)}
              disabled={!isNavigable}
              className={cn(
                "relative flex items-center justify-center px-4 py-3",
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
                
                // Etapas Não Ativas - Cinza
                !isActive && [
                  isNavigable 
                    ? "bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900/30 cursor-pointer" 
                    : "bg-gray-50 dark:bg-gray-900/20 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-50"
                ],
                
                "focus:ring-red-500"
              )}
            >
              {/* Texto - permite quebra de linha */}
              <span className="text-xs sm:text-sm text-center leading-tight">
                {step.title}
              </span>

              {/* Badge de Número Mobile */}
              <span className={cn(
                "absolute -top-2 -left-2 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold sm:hidden",
                isActive && "bg-red-500 text-white",
                !isActive && (isNavigable ? "bg-gray-300 text-gray-700" : "bg-gray-200 text-gray-400")
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
