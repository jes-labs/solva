// Parse and sort env vars for the Vercel -> Cloudflare migration.
// Used by migrate-env.sh; the logic lives here so it can be tested.

import { readFileSync } from "node:fs";

// Vercel never returns Sensitive values: `vercel env pull` writes them as ""
// or as the literal "[SENSITIVE]". Both mean the value is unknown.
export function isMissing(value) {
  return value === undefined || value === "" || value === "[SENSITIVE]";
}

const SKIP = /^(VERCEL_|TURBO_|NX_)/;

// Minimal dotenv parser for the files `vercel env pull` writes.
export function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2];
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = value.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    } else if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}

// Split pulled vars against the names the code reads.
//   secrets / build: known values to upload / paste
//   missing: present but unreadable (Sensitive), must be filled by hand
//   unset:   read by the code but not set anywhere (code default applies)
export function classify(vars, referenced) {
  const result = { secrets: {}, build: {}, missing: [], unset: [] };
  for (const name of [...new Set(referenced)].sort()) {
    if (SKIP.test(name)) continue;
    if (!(name in vars)) {
      result.unset.push(name);
      continue;
    }
    const value = vars[name];
    if (isMissing(value)) {
      result.missing.push(name);
      continue;
    }
    if (name.startsWith("NEXT_PUBLIC_")) result.build[name] = value;
    else result.secrets[name] = value;
  }
  return result;
}

// CLI: node env-parse.mjs <env-file> <names-file>
// Prints the classification as JSON.
if (import.meta.url === `file://${process.argv[1]}`) {
  const [envFile, namesFile] = process.argv.slice(2);
  const vars = parseEnv(readFileSync(envFile, "utf8"));
  const names = readFileSync(namesFile, "utf8").split(/\s+/).filter(Boolean);
  process.stdout.write(JSON.stringify(classify(vars, names)));
}
