export interface ContentsEntry {
  id: string;
  title: string;
}

export const LEGAL_CONTENTS: readonly ContentsEntry[] = [
  { id: "who-we-are", title: "Who runs this site" },
  { id: "using-this-site", title: "Using this site" },
  { id: "coverage-records", title: "Coverage records on this site" },
  { id: "eligibility", title: "Who can register" },
  { id: "open-source", title: "Open source code and our name" },
  { id: "responsibility", title: "Limits of our responsibility" },
  { id: "what-we-collect", title: "What our forms collect" },
  { id: "why-and-how-long", title: "Why we use it and how long we keep it" },
  { id: "processors", title: "Who processes it" },
  { id: "cookies", title: "Cookies and analytics" },
  { id: "your-rights", title: "Your rights and requests" },
  { id: "changes", title: "Changes to this page" },
];

export const LAST_UPDATED = { iso: "2026-11-02", label: "2 November 2026" } as const;
