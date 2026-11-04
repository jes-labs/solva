const FOLDER = "/content/blog/";

const files = import.meta.glob<unknown>("/content/blog/*.mdx", {
  query: "?raw",
  eager: true,
});

function toText(key: string, value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "default" in value) {
    const text = value.default;
    if (typeof text === "string") return text;
  }
  throw new Error(`Could not read ${key} as text.`);
}

export const postSources: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [
    key.slice(FOLDER.length, -".mdx".length),
    toText(key, value),
  ]),
);
