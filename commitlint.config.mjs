const AI_ATTRIBUTION =
  /^(co-authored-by:.*\b(claude|anthropic|copilot|codex|gemini|cursor|chatgpt|openai)\b|claude-session:|.*generated (with|by) .*(claude|ai)\b)/im;

const config = {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "no-ai-attribution": ({ raw }) => [
          !AI_ATTRIBUTION.test(raw ?? ""),
          "Commits carry no AI co-author, session or attribution lines. Remove them.",
        ],
      },
    },
  ],
  rules: {
    "body-max-line-length": [0],
    "no-ai-attribution": [2, "always"],
  },
};

export default config;
