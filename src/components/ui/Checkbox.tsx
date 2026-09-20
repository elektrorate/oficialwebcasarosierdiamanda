import type { InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export default function Checkbox({ label, className = "", id, ...props }: CheckboxProps) {
  const checkboxId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={checkboxId} className="flex items-center gap-3 cursor-pointer group">
      <input
        id={checkboxId}
        type="checkbox"
        className={`w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary-container transition-colors cursor-pointer ${className}`.trim()}
        {...props}
      />
      <span className="text-body-md text-on-surface group-hover:text-primary transition-colors">
        {label}
      </span>
    </label>
  );
}
