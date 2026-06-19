# @solva/config

Shared build presets for the Solva TypeScript tier. Every other package extends
these so there is one source of truth for compiler, lint, format, and theme
settings.

## What it provides

- `tsconfig.base.json`: strict TypeScript, `moduleResolution: bundler`, target ES2022.
- `eslint.preset.js`: ESLint flat config with typed TS rules and Prettier compatibility.
- `tailwind.preset.js`: design tokens mapped to CSS variables for the web surfaces.
- `prettier.config.js`: formatting rules used across the repo.

## Usage

`tsconfig.json` in a consuming package:

```json
{
  "extends": "@solva/config/tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

`eslint.config.js`:

```js
import { base } from "@solva/config/eslint.preset.js";
export default base;
```

`tailwind.config.js`:

```js
import preset from "@solva/config/tailwind.preset.js";
export default { presets: [preset], content: ["./src/**/*.{ts,tsx}"] };
```
