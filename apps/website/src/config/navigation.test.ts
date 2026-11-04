import { describe, expect, it } from "vitest";
import { docsLink, footerColumns, headerGroups } from "./navigation";

const allLinks = [
  ...headerGroups.flatMap((group) => group.links),
  ...footerColumns.flatMap((column) => column.links),
  docsLink,
];

describe("navigation", () => {
  it("never links to the console", () => {
    for (const link of allLinks) {
      expect(link.href).not.toContain("app.joinsolva.xyz");
    }
  });

  it("marks every off-site link as external", () => {
    for (const link of allLinks) {
      if (link.href.startsWith("http")) expect(link.external).toBe(true);
    }
  });
});
