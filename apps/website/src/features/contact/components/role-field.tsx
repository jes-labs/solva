import { cn } from "@/lib/utils";
import type { FieldBinding } from "../hooks/use-submission";
import type { Role } from "../lib/schema";
import { ROLES } from "../lib/schema";
import { FieldError } from "./field-error";
import { labelClass } from "./field-styles";

interface RoleFieldProps<F extends string> {
  binding: FieldBinding<F>;
  label: string;
  options?: readonly Role[];
}

export function RoleField<F extends string>({
  binding,
  label,
  options = ROLES,
}: RoleFieldProps<F>) {
  return (
    <fieldset aria-describedby={binding["aria-describedby"]}>
      <legend className={labelClass}>{label}</legend>
      <div
        className={cn(
          "mt-2 grid grid-cols-2 gap-px border bg-line @[26rem]:grid-cols-3",
          binding.error ? "border-short-fill" : "border-line-strong",
        )}
      >
        {options.map((option) => (
          <label
            key={option}
            className="flex h-11 cursor-pointer items-center justify-center bg-bg px-2 text-center text-ui text-text transition-colors hover:bg-raised has-[:checked]:bg-text has-[:checked]:text-bg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus"
          >
            <input
              type="radio"
              name={binding.name}
              value={option}
              defaultChecked={binding.defaultValue === option}
              required
              className="sr-only"
            />
            {option}
          </label>
        ))}
      </div>
      <FieldError id={binding.errorId} message={binding.error} />
    </fieldset>
  );
}
