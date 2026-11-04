import { describe, expect, it } from "vitest";
import { getPost, listPosts, parsePost } from "./posts";

function post(title: string, date: string, extra = "") {
  return `---
title: "${title}"
excerpt: "A short summary."
category: "Concepts"
author: "The Solva team"
date: "${date}"
cover: "/images/archive/coin-scale-1600.webp"
coverAlt: "A coin scale"
${extra}---

Some words in the body.
`;
}

describe("parsePost", () => {
  it("reads the frontmatter and body", () => {
    const parsed = parsePost("a-note", post("A note", "2026-06-03"));
    expect(parsed.meta.title).toBe("A note");
    expect(parsed.meta.featured).toBe(false);
    expect(parsed.meta.readingMinutes).toBe(1);
    expect(parsed.body).toContain("Some words in the body.");
  });

  it("rejects frontmatter with a missing field", () => {
    expect(() => parsePost("a-note", '---\ntitle: "Only a title"\n---\nBody')).toThrow(
      /Invalid frontmatter/,
    );
  });

  it("rejects a cover outside the image folder", () => {
    const raw = post("A note", "2026-06-03").replace(
      "/images/archive/coin-scale-1600.webp",
      "/blog/old.png",
    );
    expect(() => parsePost("a-note", raw)).toThrow(/Invalid frontmatter/);
  });

  it("rejects a slug that is not kebab case", () => {
    expect(() => parsePost("../secret", post("A note", "2026-06-03"))).toThrow(/Invalid post slug/);
  });
});

describe("reading the bundled posts", () => {
  const sources = {
    "older-note": post("Older note", "2026-05-01"),
    "newer-note": post("Newer note", "2026-06-01", "featured: true\n"),
  };

  it("lists every post, newest first", () => {
    const posts = listPosts(sources);
    expect(posts.map((post) => post.slug)).toEqual(["newer-note", "older-note"]);
    expect(posts[0]?.featured).toBe(true);
  });

  it("returns one post by slug", () => {
    expect(getPost("older-note", sources)?.meta.title).toBe("Older note");
  });

  it("returns null for a missing or unsafe slug", () => {
    expect(getPost("missing-note", sources)).toBeNull();
    expect(getPost("../older-note", sources)).toBeNull();
  });

  it("rejects a post with broken frontmatter", () => {
    const broken = { ...sources, "broken-note": "---\ntitle: 3\n---\nBody" };
    expect(() => getPost("broken-note", broken)).toThrow(/Invalid frontmatter/);
    expect(() => listPosts(broken)).toThrow(/Invalid frontmatter/);
  });

  it("bundles the four published posts", () => {
    expect(listPosts().length).toBe(4);
  });
});
