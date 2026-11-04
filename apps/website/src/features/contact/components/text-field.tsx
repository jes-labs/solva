import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import type { FieldBinding } from "../hooks/use-submission";
import { FieldError } from "./field-error";
import { controlClass, labelClass } from "./field-styles";

interface TextFieldProps<F extends string> extends Omit<
  ComponentProps<"input">,
  "id" | "name" | "defaultValue"
> {
  binding: FieldBinding<F>;
  label: string;
  optional?: boolean;
}

export function TextField<F extends string>({
  binding,
  label,
  optional = false,
  className,
  ...props
}: TextFieldProps<F>) {
  const { errorId, error, ...input } = binding;
  return (
    <div className={className}>
      <label htmlFor={binding.id} className={labelClass}>
        {label}
        {optional ? <span className="font-normal text-sec"> (optional)</span> : null}
      </label>
      <input
        {...props}
        {...input}
        aria-required={optional ? undefined : true}
        className={cn(controlClass, "mt-2 h-12")}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}
