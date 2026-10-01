import type { ReactNode } from "react";

interface AuthFieldProps {
  id: string;
  label: string;
  type: "email" | "password" | "text";
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  autoComplete: string;
  error?: string;
  trailing?: ReactNode;
}

export default function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  icon,
  autoComplete,
  error,
  trailing,
}: AuthFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      <div className={`flex min-h-12 items-center gap-3 rounded-lg border bg-surface px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${error ? "border-danger" : "border-border"}`}>
        <span aria-hidden="true" className="shrink-0 text-muted">{icon}</span>
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-foreground outline-none placeholder:text-muted/75"
        />
        {trailing}
      </div>
      {error && <p id={errorId} className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}