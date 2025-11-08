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
                "relative flex items-center justify-center gap-2 px-4 py-3",
                "font-semibold text-sm transition-all duration-300",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                "border-2",
                "rounded-lg",
                
                // Etapa Ativa - Vermelho/Coral #EF4444
                isActive && [
                  "bg-[#EF4444]",
                  "text-white",
                  "border-[#EF4444]",
                  "shadow-lg shadow-[#EF4444]/30",
                ],
                
                // Etapa Completa - Verde #10B981
                isCompleted && [
                  "bg-[#D1FAE5]",
                  "text-[#059669]",
                  "border-[#10B981]",
                  isNavigable && "hover:bg-[#A7F3D0] cursor-pointer hover:shadow-md"
                ],
                
                // Etapa Futura (Bloqueada) - Cinza #E5E7EB
                isFuture && [
                  "bg-[#F3F4F6]",
                  "text-[#9CA3AF]",
                  "border-[#E5E7EB]",
                  "cursor-not-allowed opacity-60"
                ],
                
                // Foco
                "focus:ring-[#EF4444]"
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

              {/* Badge de Número (apenas mobile) */}
              <span className={cn(
                "absolute -top-2 -left-2 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold sm:hidden",
                isActive && "bg-white text-[#EF4444]",
                isCompleted && "bg-[#10B981] text-white",
                isFuture && "bg-[#E5E7EB] text-[#9CA3AF]"
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
