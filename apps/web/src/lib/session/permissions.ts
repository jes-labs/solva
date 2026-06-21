import type { Role } from "./types";

// Role-based access. The dashboard reads these to filter nav and gate actions, so
// an operator only sees and does what their role permits.

export type Action =
  | "cycle.run" // run or schedule a proof cycle
  | "source.connect" // connect or manage reserve sources
  | "report.export"
  | "disclosure.manage" // selective disclosures
  | "team.manage"
  | "keys.manage"; // developer / SDK keys

const MATRIX: Record<Role, readonly Action[]> = {
  owner: [
    "cycle.run",
    "source.connect",
    "report.export",
    "disclosure.manage",
    "team.manage",
    "keys.manage",
  ],
  compliance: ["report.export", "disclosure.manage"],
  operator: ["cycle.run", "source.connect", "report.export"],
  viewer: [],
};

export function can(role: Role, action: Action): boolean {
  return MATRIX[role].includes(action);
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  compliance: "Compliance",
  operator: "Operator",
  viewer: "Viewer",
};
