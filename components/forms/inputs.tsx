"use client";

import { cn } from "@/lib/cn";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Info } from "lucide-react";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

// ---------------------------------------------------------------------------
// Field wrapper — label, tooltip, error, hint
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  htmlFor?: string;
  tooltip?: ReactNode;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, tooltip, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-xs font-medium text-[var(--fg-secondary)]">
        <span>{label}</span>
        {tooltip && (
          <InfoTooltip content={tooltip}>
            <Info className="size-3 opacity-60 hover:opacity-100" />
          </InfoTooltip>
        )}
      </label>
      {children}
      {hint && !error && (
        <span className="text-[11px] text-[var(--fg-muted)]">{hint}</span>
      )}
      {error && (
        <span className="text-[11px] text-[var(--accent-rose)]">{error}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Input — base styled text/number input
// ---------------------------------------------------------------------------

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-mono tabular-nums text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] transition-colors focus:border-[var(--accent-emerald)]/40 focus:bg-white/[0.05] focus:outline-none";

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputClass, className)} {...props} />
  ),
);
TextInput.displayName = "TextInput";

// ---------------------------------------------------------------------------
// NumberInput with unit suffix
// ---------------------------------------------------------------------------

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function NumberInput({
  value,
  onChange,
  unit,
  min,
  max,
  step,
  decimals = 0,
  id,
  placeholder,
  className,
  disabled,
}: NumberInputProps) {
  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(Number.isFinite(v) ? v : 0);
        }}
        min={min}
        max={max}
        step={step ?? (decimals > 0 ? Math.pow(10, -decimals) : 1)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(inputClass, unit && "pr-10")}
      />
      {unit && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--fg-muted)]">
          {unit}
        </span>
      )}
    </div>
  );
}

export const CurrencyInput = (props: Omit<NumberInputProps, "unit">) => (
  <NumberInput {...props} unit="€" />
);

export const PercentInput = (props: Omit<NumberInputProps, "unit">) => (
  <NumberInput {...props} unit="%" decimals={props.decimals ?? 2} />
);

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

interface SelectProps<T extends string> extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}

export function Select<T extends string>({ value, onChange, options, className, ...props }: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn(inputClass, "appearance-none pr-8", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6b78' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.75rem center",
      }}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[var(--bg-raised)]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// RadioGroup (pill-style)
// ---------------------------------------------------------------------------

interface RadioGroupProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
}

export function RadioGroup<T extends string>({ value, onChange, options }: RadioGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg glass p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              active
                ? "bg-white/[0.08] text-[var(--fg-primary)] ring-1 ring-inset ring-white/10"
                : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]",
            )}
            title={o.hint}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------

interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  tooltip?: ReactNode;
}

export function Checkbox({ checked, onChange, label, tooltip }: CheckboxProps) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 accent-emerald-500"
      />
      <span className="flex items-center gap-1.5 text-[var(--fg-primary)]">
        {label}
        {tooltip && (
          <InfoTooltip content={tooltip}>
            <Info className="size-3 opacity-60 hover:opacity-100" />
          </InfoTooltip>
        )}
      </span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Section card
// ---------------------------------------------------------------------------

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, description, children, className }: SectionProps) {
  return (
    <div className={cn("rounded-2xl glass p-6", className)}>
      <div className="mb-5">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-[var(--fg-secondary)]">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
