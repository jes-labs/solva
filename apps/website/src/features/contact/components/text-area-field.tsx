import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import type { FieldBinding } from "../hooks/use-submission";
import { FieldError } from "./field-error";
import { controlClass, labelClass } from "./field-styles";

interface TextAreaFieldProps<F extends string> extends Omit<
  ComponentProps<"textarea">,
  "id" | "name" | "defaultValue"
> {
  binding: FieldBinding<F>;
  label: string;
}

export function TextAreaField<F extends string>({
  binding,
  label,
  className,
  ...props
}: TextAreaFieldProps<F>) {
  const { errorId, error, ...input } = binding;
  return (
    <div className={className}>
      <label htmlFor={binding.id} className={labelClass}>
        {label}
      </label>
      <textarea
        {...props}
        {...input}
        aria-required
        className={cn(
          controlClass,
          "mt-2 field-sizing-content min-h-36 resize-y py-3 leading-relaxed",
        )}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}
