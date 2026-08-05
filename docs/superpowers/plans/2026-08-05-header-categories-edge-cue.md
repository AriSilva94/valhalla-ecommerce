# Header Categories Edge Cue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mobile-only scroll-fade overlay in the header's category nav with a Netflix-style edge-cut cue that works at all breakpoints, and move Sobre/FAQ/Contato out of the category scroll row.

**Architecture:** Single-file change to `app/components/Header.tsx`. The `<nav>` splits into two sibling flex regions: a scrollable category row (unconditional CSS `mask-image` fade on its right edge) and a separate, non-scrolling utility-links row (`hidden sm:flex`). No new files, no new dependencies, no JS/state changes — this is a pure markup/class restructuring.

**Tech Stack:** Next.js (App Router), React, Tailwind arbitrary-value utility classes (project already uses `[-ms-overflow-style:none]`-style arbitrary properties instead of a scrollbar-hide plugin — follow that pattern for the mask).

## Global Constraints

- No scrollbar-hide plugin exists in this project; scrollbar hiding and the new mask must use Tailwind arbitrary-property syntax (`[property:value]`), matching the existing `[-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden` pattern in `Header.tsx:134`.
- Native `overflow-x-auto` touch/trackpad scroll must be preserved on the category row — no custom JS carousel.
- Edge mask must be present unconditionally (not `sm:hidden`), per spec — it's visually inert when there's no overflow, so no JS overflow-detection is needed.
- Sobre/FAQ/Contato must be `hidden` below the `sm:` breakpoint and not added anywhere else (no footer changes).
- No automated test harness covers UI components in this repo (only `app/lib/*.test.ts` data-layer tests exist) — verification is manual via `npm run dev` in a browser, per the spec's Testing section.

---

### Task 1: Split category row and utility links, add edge-mask cue

**Files:**
- Modify: `app/components/Header.tsx:133-165` (the `<nav>` block)

**Interfaces:**
- No exported signatures change. `Header` still takes the same `{ categories, products, showTopBar, topBarText }` props and renders the same `navCats` derived list (`app/components/Header.tsx:41`).

- [ ] **Step 1: Restructure the `<nav>` markup**

Replace the current `<nav>` block (lines 133–165) with two sibling flex regions inside `<nav>`: a category scroll row with the mask applied directly on the scrolling container, and a separate utility-links row hidden below `sm:`.

```tsx
        <nav className="border-t border-t-vh-panel relative">
          <div className="max-w-310 my-0 mx-auto px-6 flex items-center gap-4">
            <div className="flex-1 min-w-0 flex gap-1 overflow-x-auto py-2.75 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_left,transparent,black_48px)] [-webkit-mask-image:linear-gradient(to_left,transparent,black_48px)]">
              {navCats.map((c, i) => (
                <Link
                  key={i}
                  href={"/categoria/" + c.slug}
                  className="vh-navcat py-2.75 px-3.5 font-semibold text-vh-12-5 font-space-grotesk tracking-vh-003 text-vh-soft cursor-pointer whitespace-nowrap border-b-2 border-b-transparent [transition:color_.12s,border-color_.12s]"
                >
                  {c.name}
                </Link>
              ))}
            </div>
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <Link
                href="/sobre"
                className="vh-lime py-2.75 px-3 font-semibold text-vh-12-5 font-space-grotesk text-vh-muted cursor-pointer whitespace-nowrap"
              >
                Sobre
              </Link>
              <Link
                href="/faq"
                className="vh-lime py-2.75 px-3 font-semibold text-vh-12-5 font-space-grotesk text-vh-muted cursor-pointer whitespace-nowrap"
              >
                FAQ
              </Link>
              <Link
                href="/contato"
                className="vh-lime py-2.75 px-3 font-semibold text-vh-12-5 font-space-grotesk text-vh-muted cursor-pointer whitespace-nowrap"
              >
                Contato
              </Link>
            </div>
          </div>
        </nav>
```

Notes on this change vs. the original:
- Dropped the old `pointer-events-none absolute ... bg-linear-to-l from-vh-bg to-transparent sm:hidden` overlay div (`Header.tsx:164`) entirely — the mask replaces it.
- Dropped the `<span className="flex-1"></span>` spacer — the category container now uses `flex-1 min-w-0` to claim remaining width itself, and the utility-links block is a `shrink-0` sibling.
- `min-w-0` on the category container is required so it can actually shrink below its content width inside the flex row (otherwise the container refuses to overflow and the mask has nothing to act on).
- Kept `scrollbar-none` class removed since it wasn't a real utility in this codebase to begin with (verified: no matching CSS rule in `globals.css`); the arbitrary-property classes are what actually hide the scrollbar.

- [ ] **Step 2: Start the dev server**

Run: `npm run dev`
Expected: server starts on `http://localhost:3000` with no compile errors.

- [ ] **Step 3: Manually verify in browser — overflow case**

Open the site home page (or any page rendering `Header`) where the category list is wide enough to overflow (check `app/page.tsx` or wherever `categories` prop is populated with enough entries — if the current dataset has few categories, temporarily note the count via React DevTools rather than editing data).

Check at two viewport widths (use browser devtools device toolbar):
- Mobile width (~375px): category row shows a fade at the right edge, no visible scrollbar, Sobre/FAQ/Contato are not rendered.
- Desktop width (~1440px): category row shows the same right-edge fade when categories overflow available width, Sobre/FAQ/Contato are visible and right-aligned, outside the category scroll area.

Confirm touch/trackpad drag-scroll still moves the category row (drag on mobile emulator, or two-finger scroll on trackpad within the row on desktop).

- [ ] **Step 4: Manually verify in browser — no-overflow case**

If possible, check a state where `navCats` is short enough not to overflow the container (or reason about it from the code: with few categories, `flex-1 min-w-0` container is wider than its content, so `overflow-x-auto` has nothing to scroll).
Expected: no visible fade/cut artifact — the mask has no effect when content doesn't reach the masked edge.

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: no new errors introduced in `app/components/Header.tsx`.

- [ ] **Step 6: Commit**

```bash
git add app/components/Header.tsx
git commit -m "feat: netflix-style edge cue for header category row"
```
