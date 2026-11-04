"use client";

import { SpinnerGapIcon } from "@phosphor-icons/react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  label: string;
  pendingLabel: string;
}

export function SubmitButton({ label, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      aria-disabled={pending}
      className="w-full disabled:opacity-80"
    >
      {pending ? <SpinnerGapIcon aria-hidden="true" className="animate-spin" /> : null}
      {pending ? pendingLabel : label}
    </Button>
  );
}
