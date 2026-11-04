import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const CONTENT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "content", "docs");

const COMMENT_RULES = [
  {
    langs: [
      "ts",
      "tsx",
      "js",
      "jsx",
      "mjs",
      "typescript",
      "javascript",
      "rust",
      "rs",
      "go",
      "solidity",
      "c",
      "cpp",
      "java",
      "kotlin",
      "swift",
      "proto",
      "protobuf",
      "jsonc",
    ],
    pattern: /(^|\s)(\/\/|\/\*)/,
  },
  {
    langs: [
      "bash",
      "sh",
      "shell",
      "zsh",
      "console",
      "toml",
      "yaml",
      "yml",
      "python",
      "py",
      "ini",
      "env",
      "dotenv",
      "dockerfile",
      "makefile",
      "just",
    ],
    pattern: /(^|\s)#(?!!)/,
  },
  { langs: ["sql", "lua", "haskell"], pattern: /(^|\s)--\s/ },
  { langs: ["html", "xml", "mdx", "md", "svg"], pattern: /<!--/ },
  { langs: ["noir", "nr"], pattern: /(^|\s)\/\// },
];

const BANNED_PROSE = [
  [/[—–]/, "an em or en dash"],
  [/\bseamless(ly)?\b/i, "seamless"],
  [/\brobust\b/i, "robust"],
  [/\bleverag(e|es|ed|ing)\b/i, "leverage"],
  [/\bdelv(e|es|ing)\b/i, "delve"],
  [/\bunlock(s|ed|ing)?\b/i, "unlock"],
  [/\bempower(s|ed|ing)?\b/i, "empower"],
  [/\bgame[- ]chang(er|ing)\b/i, "game-changer"],
  [/\bcutting[- ]edge\b/i, "cutting-edge"],
  [/\bit is important to note\b/i, "it is important to note"],
  [/\bin today's\b/i, "in today's"],
  [/\bstartups?\b/i, "startup"],
  [/\broadmap\b/i, "roadmap"],
  [/\bproof of solvency\b/i, "proof of solvency"],
  [/\bsolvency proofs?\b/i, "solvency proof"],
  [/\b(in)?solven(t|cy)\b/i, "solvent or solvency outside code"],
  [/\breplaces? (an )?audits?\b/i, "replaces audits"],
  [/\bbank(s|ing)?\b/i, "bank"],
  [/\bfintechs?\b/i, "fintech"],
  [/\bregulators?\b/i, "regulator"],
  [/!(?=\s|$)/, "an exclamation mark"],
];

function mdxFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return mdxFiles(path);
    return entry.name.endsWith(".mdx") ? [path] : [];
  });
}

function split(source) {
  const fences = [];
  const prose = [];
  let fence = null;
  source.split("\n").forEach((line, index) => {
    const open = line.match(/^\s*(```+|~~~+)\s*([\w-]*)/);
    if (!fence && open) {
      fence = { marker: open[1], lang: open[2].toLowerCase(), start: index + 1, lines: [] };
      return;
    }
    if (fence && line.trim().startsWith(fence.marker)) {
      fences.push(fence);
      fence = null;
      return;
    }
    if (fence) fence.lines.push({ text: line, number: index + 1 });
    else prose.push({ text: line, number: index + 1 });
  });
  return { fences, prose };
}

function stripInlineCode(text) {
  return text
    .replace(/`[^`]*`/g, "")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/href="[^"]*"/g, "");
}

const files = mdxFiles(CONTENT_DIR);

const pageUrls = new Set(
  files.map((file) => {
    const slug = relative(CONTENT_DIR, file)
      .replace(/\.mdx$/, "")
      .replace(/(^|\/)index$/, "");
    return slug ? `/docs/${slug}` : "/docs";
  }),
);

const INTERNAL_LINK = /(?:\]\(|href=")(\/docs[^)"#\s]*)/g;

describe("docs content", () => {
  it("has pages to check", () => {
    assert.ok(files.length > 0);
  });

  for (const file of files) {
    const name = relative(CONTENT_DIR, file);
    const { fences, prose } = split(readFileSync(file, "utf8"));

    it(`${name}: code snippets carry no comments`, () => {
      const problems = [];
      for (const fence of fences) {
        const rule = COMMENT_RULES.find((r) => r.langs.includes(fence.lang));
        if (!rule) continue;
        for (const line of fence.lines) {
          if (rule.pattern.test(line.text))
            problems.push(`line ${line.number}: ${line.text.trim()}`);
        }
      }
      assert.deepEqual(problems, []);
    });

    it(`${name}: internal links point at pages that exist`, () => {
      const source = readFileSync(file, "utf8");
      const broken = [...source.matchAll(INTERNAL_LINK)]
        .map((match) => match[1].replace(/\/$/, ""))
        .filter((url) => !pageUrls.has(url) && !url.endsWith(".md"));
      assert.deepEqual([...new Set(broken)], []);
    });

    it(`${name}: no Coming soon badge inside a heading`, () => {
      const headings = prose.filter((line) => /^#{1,6} .*<ComingSoon/.test(line.text));
      assert.deepEqual(
        headings.map((line) => `line ${line.number}`),
        [],
      );
    });

    it(`${name}: prose follows the writing rules`, () => {
      const problems = [];
      for (const line of prose) {
        const text = stripInlineCode(line.text);
        for (const [pattern, label] of BANNED_PROSE) {
          if (pattern.test(text)) problems.push(`line ${line.number}: ${label}`);
        }
      }
      assert.deepEqual(problems, []);
    });
  }
});
