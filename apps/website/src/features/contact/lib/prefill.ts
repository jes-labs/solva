import type { Role } from "./schema";
import { ROLES } from "./schema";

export interface ContactPrefill {
  organisation: string;
  role: Role | "";
}

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export function readPrefill(params: SearchParams): ContactPrefill {
  const organisation = first(params.organisation).replace(/\s+/g, " ").trim().slice(0, 160);
  const wanted = first(params.role).trim().toLowerCase();
  const role = ROLES.find((option) => option.toLowerCase() === wanted) ?? "";
  return { organisation, role };
}
