import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface CurrencyInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value = "", onChange, placeholder, className, disabled, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value);

    const formatCurrency = (val: string) => {
      // Remove tudo que não for número
      const numbers = val.replace(/\D/g, '');
      
      // Se não tem números, retorna vazio
      if (!numbers) return '';
      
      // Converte para número e divide por 100 para ter os centavos
      const amount = parseInt(numbers) / 100;
      
      // Formata como moeda brasileira
      return amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const formatted = formatCurrency(rawValue);
      setDisplayValue(formatted);
      
      // Retorna apenas os números para o componente pai
      const numbersOnly = rawValue.replace(/\D/g, '');
      const numericValue = numbersOnly ? (parseInt(numbersOnly) / 100).toString() : '';
      onChange?.(numericValue);
    };

    React.useEffect(() => {
      if (value !== undefined) {
        // Se receber um valor numérico, formata para exibição
        const numericValue = parseFloat(value) || 0;
        const formatted = numericValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        setDisplayValue(formatted);
      }
    }, [value]);

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          R$
        </span>
        <Input
          {...props}
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn("pl-10", className)}
          disabled={disabled}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";