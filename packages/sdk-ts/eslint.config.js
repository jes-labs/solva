import { base } from "@solva/config/eslint.preset.js";

// scripts/ holds Node dev and e2e harness scripts, not shipped library code, so
// they are not linted with the library (browser) ruleset.
export default [...base, { ignores: ["scripts/**"] }];
