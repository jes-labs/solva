# ADR-2026-11-01: Brand system v3 and the Seal ticks logo

- **Status:** Accepted
- **Approved by:** Emmanuel Omemgboji, 2026-11-02
- **Companion:** [ADR-2026-11-01-brand-system-for-dummies.md](ADR-2026-11-01-brand-system-for-dummies.md)

## Context

Solva's brand lives in `packages/brand`: chartreuse `#CFE524` on olive-black `#0A0C06` (dark) and paper `#F4F5EE` (light), Bricolage Grotesque, Hanken Grotesk, IBM Plex Mono and an IBM Plex Serif italic accent word. The founders want to keep the colour and the logo mark and make the system better and more institutional.

Problems found (scratchpad `rebuild/brand/BRAND-PLAN-v3.md`, ratios from `v3/contrast-v3.md`):

- Light-mode accent text `#6E7A12` is 4.30:1 on paper and fails WCAG AA for body text.
- Amber `#E0902E` is 2.33:1 in light mode and sits next to chartreuse; red `#D8483B` fails AA on light surfaces.
- There are no product state colours for covered, short and stale; a natural "covered" green would collide with chartreuse.
- Chartreuse is used as glow, page texture and decoration, which reads as a developer tool.
- Logo lockups, the OG image and the social banners set "Solva" as live text and carry the line "zero-knowledge proof-of-reserves".

Three rounds were explored (v1 "Ledger", v2 five new colour directions, v3 refinement of the existing system). The founders chose v3 and the "Seal ticks" logo option on 2026-11-02.

## Options considered

### Keep the current tokens

No work, but keeps the contrast failures and has no state colours.

### Replace the brand (v1 or v2)

Rejected by the founders: the colour and mark are already recognised.

### Refine the current system (v3)

Keep chartreuse and the neutrals; fix contrast, add scales, surfaces and states; add one element to the mark.

## Decision

Refine the current system (v3).

1. **Colour.** Tokens from `rebuild/brand/tokens.proposal.css` (v3): chartreuse scale 50 to 950 with 400 as the brand colour, olive neutral scale, a new raised surface, light-mode accent text `#505A0F` (6.81:1), ring `#6A770F` in light mode. Chartreuse is a signal only: primary button, logo ring, focus ring, the edge where coverage is proven, the seal's pulse. Never a background, glow or chart series. The dot-grid page texture and the button glow are retired.
2. **States.** Covered `#16734A` / `#5FD3A0`, short `#B4301F` / `#F2836F`, stale slate `#4C5B6B` / `#A3B1C2` (light / dark). Each state also has a shape (dot, down triangle, dashed square) so it reads without colour. Number-card tints (moss, teal, khaki, slate) mark categories only, never states.
3. **Type.** Bricolage Grotesque for the wordmark and headings from 30px; Hanken Grotesk for text and tabular figures; IBM Plex Mono for addresses and code only. The serif italic accent word and tracked uppercase eyebrows are retired. `next/font` variables are renamed `--ff-*` to avoid self-reference inside Tailwind v4's `@theme`.
4. **Logo.** The mark (`M32.5 20 L67.5 41 L32.5 62 L32.5 80 L64.5 80`) and the wordmark keep their shapes. The Seal ticks element (the proof seal's tick ring: short and long ticks around the mark) is added. Files: `rebuild/brand/logo-v3/seal-*` (horizontal and stacked lockups, light and dark, app icon). At 16px the favicon may drop to the mark alone if the ticks blur; tested in the build. The mark grows into the full proof seal in the website hero.
5. **Assets.** Re-export lockups, favicon set, OG image, GitHub banner and X header with the wordmark outlined and without the zero-knowledge tagline.
6. **Scope.** The new website and the Mintlify docs use v3 now. `packages/brand` gains the v3 tokens with the old variable names kept as aliases, so the console keeps working unchanged until it is next rebuilt.

## Diagram

```
tokens.proposal.css (v3) ─► packages/brand/tokens.css (+ aliases) ─► apps/web (unchanged look)
                        └► apps/website globals.css @theme
                        └► docs.json colours (Mintlify)
logo-v3/seal-* (outlined) ─► favicons, OG image, banners, docs logo, website header and footer
```

## Consequences

- Every text pairing passes WCAG AA in both themes; non-text elements pass 3:1.
- Chartreuse becomes rarer and therefore stronger; designers must not use it for decoration.
- Two type families plus mono instead of four.
- Brand assets in `apps/website/public/brand` are replaced.

## Verification

- Contrast recomputed from the final CSS (`v3/palette.py`).
- Favicons checked at 16, 32 and 48px on light and dark browser chrome.
- Lighthouse accessibility 98 or more on every website route in both themes.
- Founder sign-off on the exported logo files.
