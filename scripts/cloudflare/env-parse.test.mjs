import { test } from "node:test";
import assert from "node:assert/strict";
import { classify, isMissing, parseEnv } from "./env-parse.mjs";

test("empty and [SENSITIVE] both count as missing", () => {
  assert.equal(isMissing(""), true);
  assert.equal(isMissing("[SENSITIVE]"), true);
  assert.equal(isMissing(undefined), true);
  assert.equal(isMissing("re_123"), false);
});

test("parses the quoting vercel env pull writes", () => {
  const vars = parseEnv(
    [
      "# Created by Vercel CLI",
      'RESEND_API_KEY="re_abc"',
      'ORCH_API_TOKEN=""',
      'SOLVA_KEY="[SENSITIVE]"',
      'MULTI="a\\nb"',
      "PLAIN=value",
    ].join("\n"),
  );
  assert.equal(vars.RESEND_API_KEY, "re_abc");
  assert.equal(vars.ORCH_API_TOKEN, "");
  assert.equal(vars.SOLVA_KEY, "[SENSITIVE]");
  assert.equal(vars.MULTI, "a\nb");
  assert.equal(vars.PLAIN, "value");
});

test("classify splits secrets, build vars, missing and unset", () => {
  const vars = {
    RESEND_API_KEY: "re_abc",
    ORCH_API_TOKEN: "",
    SOLVA_KEY: "[SENSITIVE]",
    NEXT_PUBLIC_SITE_URL: "https://joinsolva.xyz",
    VERCEL_URL: "x.vercel.app",
    TURBO_CACHE: "remote:rw",
    UNUSED: "not read by code",
  };
  const referenced = [
    "RESEND_API_KEY",
    "ORCH_API_TOKEN",
    "SOLVA_KEY",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_DOCS_URL",
    "VERCEL_URL",
  ];
  const r = classify(vars, referenced);
  assert.deepEqual(r.secrets, { RESEND_API_KEY: "re_abc" });
  assert.deepEqual(r.build, { NEXT_PUBLIC_SITE_URL: "https://joinsolva.xyz" });
  assert.deepEqual(r.missing, ["ORCH_API_TOKEN", "SOLVA_KEY"]);
  assert.deepEqual(r.unset, ["NEXT_PUBLIC_DOCS_URL"]);
});
