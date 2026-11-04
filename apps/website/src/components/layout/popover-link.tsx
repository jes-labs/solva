"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

interface PopoverLinkProps extends ComponentProps<typeof Link> {
  popoverId: string;
}

export function PopoverLink({ popoverId, onClick, ...props }: PopoverLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        document.getElementById(popoverId)?.hidePopover();
      }}
    />
  );
}
