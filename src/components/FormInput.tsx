
import React, { useState, useEffect, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  formatter?: (value: string) => string;
  required?: boolean;
  className?: string;
  type?: string;
  maxLength?: number;
  disabled?: boolean;
  readOnly?: boolean;
  // Adicionando a prop para o valor numérico associado
  numericValue?: number;
}

const FormInput = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  formatter,
  required = false,
  className,
  type = "text",
  maxLength,
  disabled,
  readOnly,
  numericValue,
}: FormInputProps) => {
  const [focused, setFocused] = useState(false);
  const [formattedValue, setFormattedValue] = useState(value);

  useEffect(() => {
    if (formatter && value) {
      setFormattedValue(formatter(value));
    } else {
      setFormattedValue(value);
    }
  }, [value, formatter]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (formatter) {
      const originalEvent = { ...e };
      const formatted = formatter(e.target.value);
      
      // Create a new synthetic event
      const newEvent = {
        ...originalEvent,
        target: {
          ...originalEvent.target,
          value: formatted,
        },
      } as ChangeEvent<HTMLInputElement>;
      
      onChange(newEvent);
    } else {
      onChange(e);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label 
        htmlFor={id} 
        className={cn(
          "transition-all duration-200",
          focused ? "text-delta-500 dark:text-delta-400" : "",
          required ? "after:content-['*'] after:ml-1 after:text-destructive" : ""
        )}
      >
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={formattedValue}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (onBlur) onBlur();
        }}
        placeholder={placeholder}
        className={cn(
          "transition-all duration-200",
          focused ? "border-delta-500 dark:border-delta-400 ring-1 ring-delta-300 dark:ring-delta-600" : "",
          error ? "border-destructive" : ""
        )}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={readOnly}
        data-numeric-value={numericValue !== undefined ? numericValue : ''}
      />
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
};

export default FormInput;
