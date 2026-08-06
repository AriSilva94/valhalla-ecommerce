# Header categories: Netflix-style edge cue

## Problem

`Header.tsx` renders the category nav row with `overflow-x-auto` + hidden
scrollbar. The only "more content" signal is a `pointer-events-none`
gradient overlay div, and it's `sm:hidden` (mobile only). On top of that,
Sobre/FAQ/Contato links share the same scrollable row as categories (after
a `flex-1` spacer), so the item sitting at the visible edge can be a utility
link instead of a category, undermining any edge cue.

## Goals

- Signal "more categories exist" via a partial/cut-off look at the row's
  right edge, à la Netflix rows — without a visible scrollbar or arrows.
- Keep native touch/trackpad drag-scroll (no custom JS carousel).
- Make the cue consistent at all breakpoints (today it's mobile-only).
- Keep Sobre/FAQ/Contato out of the category scroll row so the edge item
  is always a category.

## Non-goals

- Exact 50/50 physical crop of the last item (would need JS measurement /
  ResizeObserver). A CSS mask fade is enough to communicate overflow and
  needs no JS.
- Adding Sobre/FAQ/Contato to the footer or anywhere else on mobile.

## Design

**Split the nav into two independent regions:**

1. Category row — its own `overflow-x-auto` container, scrollbar hidden
   (existing `scrollbar-none` classes), holding only the `navCats.map(...)`
   links. No `flex-1` spacer, no utility links inside it.
2. Utility links (Sobre/FAQ/Contato) — separate flex block, right-aligned,
   `hidden sm:flex` (hidden on mobile, visible from `sm:` breakpoint up).
   No footer change — these links simply don't render on mobile.

**Edge cue via CSS mask, not overlay div:**

- Remove the current `pointer-events-none absolute ... bg-linear-to-l ...
  sm:hidden` overlay div.
- Apply `mask-image: linear-gradient(to left, transparent, black 48px)`
  (plus `-webkit-mask-image` for Safari) directly on the category scroll
  container, unconditionally (no `sm:hidden`), so the same fade applies at
  every breakpoint.
- This is safe to leave always-on: when content doesn't overflow the
  container, there's nothing under the mask region to fade, so no visible
  effect. The fade only becomes visible once there's a truncated category
  peeking at the edge.

**Behavior preserved:**

- `Link` navigation, hover/active styles (`vh-navcat` classes) unchanged.
- Native `overflow-x-auto` scrolling (touch drag, trackpad) unchanged —
  only the scrollbar visibility and edge-hint mechanism change.

## Testing

- Manual check in browser: narrow viewport (mobile) and wide viewport
  (desktop) with enough categories to overflow — edge fade should appear
  in both; with few categories (no overflow) — no visible fade.
- Manual check: Sobre/FAQ/Contato hidden below `sm:`, visible and outside
  the category scroll row above `sm:`.
- Manual check: touch/drag scroll still works on the category row.
