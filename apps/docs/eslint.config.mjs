import { base } from "@solva/config/eslint.preset.js";

export default [...base, { ignores: [".next/**", ".source/**", ".open-next/**", "next-env.d.ts"] }];
