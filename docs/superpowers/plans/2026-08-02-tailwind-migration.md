# Tailwind Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all `style={css(...)}` and `app/lib/css.ts` usage with Tailwind CSS classes using `clsx` and `tailwind-merge`, preserving the validated Valhalla layout.

**Architecture:** Keep the existing component/page structure intact. Add one class merging helper (`app/lib/cn.ts`) and migrate styles in-place to Tailwind utilities, using arbitrary values where exact colors, spacing, gradients, shadows, and fonts must match the current design.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, `clsx`, `tailwind-merge`, TypeScript.

---

### Task 1: Tailwind Base Setup

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `app/lib/cn.ts`
- Modify: `app/globals.css`

- [ ] Install `clsx` and `tailwind-merge`.
- [ ] Create `cn(...inputs: ClassValue[])` using `clsx` and `twMerge`.
- [ ] Add `@import "tailwindcss";` to `app/globals.css`.
- [ ] Keep global body/reset/keyframes rules that are application-level, not component styling.

### Task 2: Migrate Components and Pages

**Files:**
- Modify all `app/**/*.tsx` files using `style={css(...)}` or importing `app/lib/css.ts`.

- [ ] Replace static inline style objects with exact Tailwind class strings.
- [ ] Replace dynamic style objects with `cn()` conditional classes.
- [ ] Preserve interaction states using Tailwind `hover:`, `focus:`, `active:`, `transition-*`, and exact arbitrary values.
- [ ] Remove `css` imports from every migrated file.

### Task 3: Remove Legacy CSS Helper

**Files:**
- Delete: `app/lib/css.ts`

- [ ] Verify no imports or `css(...)` usages remain.
- [ ] Delete `app/lib/css.ts`.

### Task 4: Verification

**Commands:**
- `npm run build`
- `npm run lint`
- `rg -n 'style=\\{|css\\(|lib/css' app`

- [ ] Confirm build still succeeds.
- [ ] Confirm no legacy inline style helper usage remains.
- [ ] Report pre-existing lint failures separately if unchanged.
