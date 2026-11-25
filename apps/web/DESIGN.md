---
name: Job Tracker
description: A local-first operational job-search workspace built with shadcn/ui (aria-nova + React Aria) and Coss-inspired recessed CardFrame surfaces.
colors:
  primary: "oklch(0.195 0.006 264)"
  primary-foreground: "oklch(0.988 0 0)"
  ring: "oklch(0.56 0.19 258)"
  ring-soft: "oklch(0.56 0.19 258 / 12%)"
  destructive: "oklch(0.577 0.245 27.325)"
  destructive-soft: "oklch(0.577 0.245 27.325 / 10%)"
  status-blue: "oklch(0.623 0.214 259.815)"
  status-violet: "oklch(0.606 0.25 292.717)"
  status-amber: "oklch(0.769 0.188 70.08)"
  status-orange: "oklch(0.705 0.213 47.604)"
  status-emerald: "oklch(0.696 0.17 162.48)"
  status-rose: "oklch(0.645 0.246 16.439)"
  background: "oklch(0.995 0.001 264)"
  foreground: "oklch(0.145 0.005 264)"
  card: "oklch(1 0 0)"
  secondary: "oklch(0.962 0.003 264)"
  secondary-foreground: "oklch(0.205 0.006 264)"
  muted: "oklch(0.958 0.003 264)"
  muted-foreground: "oklch(0.515 0.012 264)"
  border: "oklch(0.908 0.004 264)"
  input: "oklch(0.895 0.005 264)"
  sidebar: "oklch(0.964 0.003 264)"
  sidebar-foreground: "oklch(0.185 0.006 264)"
  sidebar-accent: "oklch(0.932 0.005 264)"
  sidebar-border: "oklch(0.9 0.005 264)"
  dark-background: "oklch(0.152 0.005 264)"
  dark-foreground: "oklch(0.975 0.002 264)"
  dark-card: "oklch(0.182 0.006 264)"
  dark-popover: "oklch(0.192 0.006 264)"
  dark-muted: "oklch(0.225 0.006 264)"
  dark-muted-foreground: "oklch(0.685 0.01 264)"
  dark-sidebar: "oklch(0.118 0.005 264)"
  dark-border: "oklch(1 0 0 / 10%)"
  dark-ring: "oklch(0.66 0.17 255)"
typography:
  display:
    fontFamily: "\"Geist Variable\", -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
    fontFeature: "\"cv02\", \"cv03\", \"cv04\", \"cv11\""
  headline:
    fontFamily: "\"Geist Variable\", -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  title:
    fontFamily: "\"Geist Variable\", -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
    letterSpacing: "-0.025em"
  body:
    fontFamily: "\"Geist Variable\", -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "normal"
  label:
    fontFamily: "\"Geist Variable\", -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "normal"
    fontFeature: "tabular-nums"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  pill: "9999px"
spacing:
  2xs: "2px"
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-outline-hover:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
  button-destructive:
    backgroundColor: "{colors.destructive-soft}"
    textColor: "{colors.destructive}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  input-control:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
  select-trigger:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 8px 8px 10px"
    height: "32px"
  badge-stage:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "22px"
  card-frame:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.2xl}"
    padding: "4px"
  card-frame-panel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: Job Tracker

## Overview

**Creative North Star: "The Recessed-Frame Career Operating Desk"**

Job Tracker is a local-first operational SaaS workspace built in the lineage of Linear, Attio, and Coss UI (`coss.com/ui`). Engineered on `shadcn/ui` (`aria-nova` style) with `react-aria-components` and Tailwind v4 OKLCH design tokens, the interface treats an active job search as a high-precision personal command center: 11 atomic pipeline stages, priority triage, `#tag` taxonomies, coding assessments, chronological deadlines, deterministic resume skill coverage, and multi-currency offer packages stay scannable at a glance and editable without losing context.

The visual system achieves calm authority through two architectural commitments: a collapsible **Inset Sidebar** shell where a rounded main workspace canvas floats inside a recessed outer rail, and **two-layer `CardFrame` bevels** where inner elevated panels sit inside `4px`-inset muted trays with `1px` perimeter rings and subtle top-edge specular highlights. Unstyled native `<select>` menus, monolithic custom CSS overrides, decorative marketing gradients, and heavy floating drop shadows are strictly refused across both light and dark polarities.

**Key Characteristics:**
- **Inset App-Shell Architecture:** A collapsible `Sidebar` (`variant="inset"`, `collapsible="icon"`, `⌘B`) cradles a floating `14px`-rounded `SidebarInset` workspace canvas with a sticky translucent breadcrumb and action bar.
- **Two-Layer `CardFrame` Surfaces:** Recessed outer trays (`18px` radius, `4px` bezel padding, muted fill) frame inner `CardFramePanel` sheets (`14px` concentric radius, `1px` ring, top-edge specular highlight) without heavy drop shadows.
- **Cool-Axis OKLCH Dual Polarity:** Every neutral surface, hairline border, and sidebar step is calibrated along a unified `264°` cool-zinc OKLCH hue axis with automatic system sync and manual light/dark override.
- **React Aria Keyboard-First Controls:** Accessible popovers, inline stage `Select` pills, segmented `ToggleGroup` view switchers, a global `⌘K` `CommandDialog`, `N` quick-create, and a non-destructive right-hand `EditorSheet` replace full-page navigation churn.
- **Tabular-Numeral Telemetry Discipline:** `Geist Variable` with OpenType stylistic sets (`cv02`, `cv03`, `cv04`, `cv11`) and `tabular-nums` governs every KPI strip, relative deadline pill, conversion bar, and ISO-currency offer breakdown.

## Colors

The palette anchors structural chrome on a cool `264°` OKLCH zinc-slate neutral ramp with monochrome primary actions, a `258°` cobalt focus ring, and translucent semantic status channels for pipeline stages, priorities, and agenda events.

### Primary
- **Obsidian Slate (`primary`)**: High-contrast monochrome fill (`--primary`, shifting to near-white `oklch(0.965 0.003 264)` in `.dark`) reserved for primary CTAs (`New application`, `Save changes`, `Sign in`), brand monogram tiles, `Progress` indicators, and offer base-salary bar segments, paired with **Crisp Alabaster (`primary-foreground`)**.
- **Signal Cobalt (`ring` & `ring-soft`)**: Keyboard `:focus-visible` rings (`3px` halo at `50%` alpha), caret color, text selection highlight (`22%` mix), Kanban drag-over drop targets (`ring-2 ring-ring bg-ring/10`), and active `#tag` filter chips (`border-ring/60 bg-ring/12`); lifts to `dark-ring` in dark mode.

### Secondary
- **Applied Cobalt (`status-blue`)**: Tinted badge channel (`bg-blue-50/90 border-blue-200/90 text-blue-700` light; `bg-blue-500/15 border-blue-500/30 text-blue-300` dark) for the `Applied` stage, `Follow-up` agenda events, and bonus segments on offer bars.
- **Screening Violet (`status-violet`)**: Tinted badge channel for `Recruiter Contacted` (violet), `Screening` (purple), and `Interview round` agenda events.
- **Interview Amber (`status-amber`) & Final Orange (`status-orange`)**: Tinted warm channels encoding `Technical Interview` (amber), `Final Interview` (orange), `Medium` priority, pending OA warning pills, interview prep callouts, and `Application deadline` / `Assessment due` agenda events.

### Tertiary
- **Offer Emerald (`status-emerald`)**: Tinted positive channel encoding the `Offer` stage, `Offer decision` agenda events, inline table/board compensation pills, and equity grant bar segments.
- **Critical Rose (`status-rose`) & Destructive Crimson (`destructive` / `destructive-soft`)**: Rose badges encode `Rejected` stages and `High` priority; `--destructive` and `--destructive-soft` drive form validation rings, error alert banners, and two-step deletion triggers (`oklch(0.68 0.19 23)` in `.dark`).

### Neutral
- **Sidebar Well (`sidebar`, `sidebar-accent`, `sidebar-border`) & Dark Sidebar (`dark-sidebar`)**: Outer viewport gutter and navigation rail (`--sidebar`), recessed darker than the canvas in `.dark` so the inset workspace sheet steps forward naturally.
- **Workspace Canvas (`background` / `dark-background`)**: Primary `SidebarInset` canvas, form field fills inside elevated panels, and sign-in right column.
- **Elevated Sheet (`card` / `dark-card` & `dark-popover`)**: Pure white inner `CardFramePanel` surfaces, Kanban cards, command-bar `SelectTrigger` and `InputGroup` controls, and floating `Popover` / `Sheet` drawers.
- **Recessed Tray (`muted` / `dark-muted`) & Secondary Pill (`secondary` / `secondary-foreground`)**: Outer `CardFrame` wells (`bg-muted/65` light, `bg-muted/35` dark), table headers (`bg-muted/40`), segmented `ToggleGroup` tracks, `Kbd` keycaps, and neutral count badges.
- **Primary Ink (`foreground` / `dark-foreground`) & Muted Slate (`muted-foreground` / `dark-muted-foreground`)**: Primary titles, role buttons, and KPI numerals versus table headers, metadata, field hints, and timestamps; `zinc` tinted badges encode `Discovered`, `Saved`, `Withdrawn`, `Low` priority, and dashed `Ghosted`.
- **Structural Hairline (`border`, `input`, `dark-border`)**: `1px` cell dividers (`divide-border/70`), control borders (`--input`), and translucent white hairlines (`10%`–`13%` alpha) in dark mode.

### Named Rules
**The Cool-Axis Neutral Stack Rule.** Every neutral surface from `--sidebar` through `--background`, `--muted`, and `--card` shares the `264°` cool-zinc OKLCH hue angle so three-tier depth (`Sidebar` → `CardFrame` tray → `CardFramePanel` card) reads cleanly without hue muddy-shift.
**The Monochrome Chrome, Semantic Signal Rule.** Structural controls, primary buttons, and `Progress` bars stay strictly monochrome (`--primary`), reserving chromatic hues exclusively for semantic pipeline state (11 stages, 3 priorities, 6 agenda kinds, and focus/drop rings).
**The Tinted-Pill Status Encoding Rule.** Status and priority pills always pair a translucent low-chroma wash (`50/90` light, `500/15` dark) with a matching `1px` border (`dashed` exclusively for `Ghosted`) and a `6px` (`size-1.5`) saturated dot—never solid neon fills.

## Typography

**Display Font:** `Geist Variable` (with `-apple-system, BlinkMacSystemFont, sans-serif` fallback)
**Body Font:** `Geist Variable` (with `-apple-system, BlinkMacSystemFont, sans-serif` fallback)
**Label/Mono Font:** `Geist Variable` (with `tabular-nums` numeric alignment)

**Character:** A single-family technical sans-serif system tuned with OpenType stylistic sets (`"cv02", "cv03", "cv04", "cv11"`) on the root element. Rather than wide size jumps or secondary display fonts, hierarchy comes from tight tracking (`-0.025em`) on `600`-weight headings paired with compact `12px`–`14px` operational copy.

### Hierarchy
- **Display** (`600` weight, `1.875rem`–`2.25rem` / `30px`–`36px`, `1.25` line-height, `-0.025em` letter-spacing): Split-screen onboarding hero headline (`text-3xl xl:text-4xl`) and total annual offer package figures (`text-3xl` / `30px` with `tabular-nums`).
- **Headline** (`600` weight, `1.25rem` / `20px`, `1.4` line-height, `-0.025em` letter-spacing): Primary workspace desk `h1` headings (`Applications`, `Agenda`, `Offers`, `Analytics`), accompanied by `1.5rem` (`24px`, `tabular-nums`) for telemetry KPI numerals, sign-in `h2` titles, and live offer previews.
- **Title** (`600` weight, `1.125rem` / `18px`, `1.55` line-height, `-0.025em` letter-spacing): Slide-over `EditorSheet` role title (`SheetTitle`).
- **Body** (`400`–`600` weight, `0.875rem` / `14px`, `1.43` line-height): Workspace subtitles, interactive table/Kanban role names (`600` weight), buttons (`500` weight, `0.8rem` / `12.8px` at `size="sm"`), and desktop form controls (`16px` below `768px` on `<Input>` to prevent mobile iOS zoom, `14px` at `md:` and up).
- **Label** (`500`–`600` weight, `0.75rem` / `12px`, `1.33` line-height, `tabular-nums`): `CardFrameTitle` headers, table column headers, `StageBadge` and `PriorityBadge` pills, form `<Label>` captions, breadcrumb items, `Kbd` hints, and relative date counters.

### Named Rules
**The Tabular Telemetry Rule.** Every KPI figure, badge counter, `SidebarMenuBadge`, relative day offset, conversion percentage, and `Intl.NumberFormat` currency figure must enforce `tabular-nums` so live filtering and stage updates never cause horizontal layout jitter.
**The Compact Operational Ramp Rule.** Keep operational controls, metadata, and table rows anchored at `12px` (`text-xs`) and `14px` (`text-sm`), reserving `18px`+ strictly for view titles and primary financial/KPI callouts.

## Layout

The workspace uses a persistent **Inset Sidebar App-Shell** (`SidebarProvider` + `Sidebar variant="inset" collapsible="icon"`) on desktop and a split-screen `1.12fr / 0.88fr` grid (`min-h-dvh`) on the unauthenticated Sign-In screen.

- **Collapsible Inset Navigation Rail:** Fixed `16rem` (`256px`) left rail (`p-2`) containing brand identity, stacked `+ New application` (`N`) and `Search & jump…` (`⌘K`) triggers, `SidebarMenu` items with right-aligned `SidebarMenuBadge` counters, a bottom-pinned `Next Deadlines` mini-ledger (up to 3 upcoming items), and a user session `DropdownMenu` footer. Collapses via `⌘B`, `SidebarTrigger`, or `SidebarRail` to a `3rem` (`48px`) icon rail (`+ 16px` inset padding) with tooltips, and converts below `768px` (`useIsMobile`) into an `18rem` (`288px`) slide-over `Sheet`.
- **Floating Workspace Canvas (`SidebarInset`):** Surrounded on `≥768px` (`md:`) by an `8px` (`m-2 ml-0`) outer viewport reveal on `--sidebar` with `14px` (`rounded-xl`) corners and a `1px` perimeter ring (`ring-border/70`). Topped by a sticky `48px` (`h-12`) `InsetHeaderBar` (`bg-background/85 backdrop-blur-md`) that dynamically reveals `Command ⌘K` and `New application` buttons whenever the sidebar is collapsed or on mobile.
- **Centered Desk Container:** Fluid `max-w-[1440px]` vertical flex stack (`p-4` on mobile, `p-6` / `24px` at `lg: ≥1024px`) with a uniform `20px` (`gap-5`) macro rhythm between page heading, telemetry strip, command filter bar, and primary `CardFrame` data surface.
- **Desk-Specific Spatial Grids:**
  - **Telemetry Strips:** Contiguous `divide-x divide-border/70` cells (`p-4` / `16px` padding) inside `CardFramePanel`—2×2 wrapping to 4 columns (`lg:grid-cols-4`) on `Applications`, and 2×3 wrapping to 3×2 (`md:grid-cols-3`) and 6 columns (`xl:grid-cols-6`) on `Analytics`.
  - **Pipeline Ledger & Mobile Stack:** Full-width 6-column `<Table>` on `md: ≥768px` (`px-3.5 py-3` primary cell, `px-2.5 py-3` data cells), automatically switching below `768px` (`md:hidden`) to a `divide-y` card stack (`p-4` per item) with inline stage select and action menu.
  - **Kanban Board:** Horizontal scrolling flex track (`gap-3` / `12px`) of fixed `288px` (`w-72`) `CardFrame` stage columns (`min-h-72`), defaulting to populated stages with a one-click `All 11 stages` toggle (and auto-expanding all 11 drop targets during drag operations).
  - **Offers & Analytics Grids:** `OffersDesk` uses a 2-column card grid (`lg:grid-cols-2 gap-4`); `Analytics` uses a 12-column bento (`lg:grid-cols-12 gap-4`) pairing a `7 / 5` conversion row above a `4 / 4 / 4` diagnostic row.
  - **Slide-Over Inspector (`EditorSheet`):** Right-docked modal drawer (`w-full sm:max-w-2xl` / `672px`, `max-h-dvh`) with fixed header (`px-6 pt-5 pb-4`), scrollable line-tabbed body (`px-6 py-5`), 2-column `FieldGrid` (`sm:grid-cols-2 gap-4`, full-span `sm:col-span-2` for wide fields and textareas), and sticky footer (`px-6 py-3.5`).

## Elevation & Depth

Job Tracker uses a **recessed-bezel and hairline-ring depth model** inspired by Coss UI rather than floating Material drop shadows. Hierarchy is established by stepping luminance from the outer `--sidebar` shell into muted `CardFrame` wells (`bg-muted/65` light, `bg-muted/35` dark) and lifting inner `CardFramePanel` surfaces to pure `--card` with a `1px` perimeter ring and top-edge inner highlight.

### Shadow Vocabulary
- **CardFramePanel Specular Bevel** (`0 1px 2px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)` in light mode; `0 1px 2px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)` in dark mode): Signature tactile finish on every `CardFramePanel`, combining a whisper-light grounding shadow with a crisp top-edge inner specular highlight.
- **Kanban & Active Toggle Micro-Lift** (`shadow-2xs` / `shadow-xs`): Subtle physical lift on draggable Kanban role cards, brand monogram tiles, and selected `ToggleGroupItem` pills.
- **Inset Canvas Shadow** (`shadow-sm` paired with `ring-1 ring-border/70`): Separates the rounded desktop `SidebarInset` workspace canvas from the recessed `--sidebar` frame.
- **Floating Overlay Elevation** (`shadow-md ring-1 ring-foreground/10` on `SelectPopover` and `DropdownMenu`; `shadow-lg` over a `bg-black/10 backdrop-blur-xs` `ModalOverlay` on `EditorSheet` and `CommandDialog`): Reserved strictly for transient React Aria overlays, menus, and drawers.

### Named Rules
**The Recessed-Tray Bevel Rule.** Primary data tables, KPI strips, offer cards, agenda schedules, analytics charts, and inspector form groups must sit inside a `CardFrame` (`p-1` recessed muted bezel) + `CardFramePanel` pair—never as raw unframed white boxes floating with heavy blur shadows.
**The Ring-Bounded Surface Rule.** Every elevated surface (`CardFrame`, `CardFramePanel`, `SidebarInset`, Kanban card, `SelectPopover`) pairs its surface fill with an explicit `1px` translucent ring (`ring-border/80`, `ring-foreground/[0.07]`, or `dark:ring-white/[0.08]`) so edges stay razor-sharp in both light and dark modes.

## Shapes

Corner geometry follows strict **concentric radius nesting** anchored on `--radius: 0.625rem` (`10px`), stepping down cleanly from outer frames to inner panels, controls, and micro-pills.

- **Outer Recessed Trays (`18px` / `rounded-2xl`):** `CardFrame` outer wrapper with `4px` (`p-1`) internal padding.
- **Concentric Inner Panels & Primary Containers (`14px` / `rounded-xl`):** `CardFramePanel` (`calc(var(--radius-2xl) - 4px)` = `14px`), desktop `SidebarInset`, draggable Kanban cards, `CommandDialog`, sidebar `Next Deadlines` group, agenda `48×48px` calendar tiles, offer 3-column breakdown boxes, resume match score banners, and repeatable `EntryCollection` cards.
- **Interactive Controls & Monogram Squircles (`10px` / `rounded-lg`):** Default `Button`, `Input`, `InputGroup`, `Textarea`, `SelectTrigger`, `ToggleGroup` outer track, `SelectPopover`, and `CompanyAvatar` (`rounded-lg after:rounded-lg` squircle—never circular for company marks).
- **Compact Controls, Badges & Menu Items (`8px` / `rounded-md`):** `StageBadge`, `PriorityBadge`, `AgendaKindBadge`, `#tag` filter buttons, `SelectItem`, `ToggleGroupItem`, and `xs`/`sm` buttons (`min(var(--radius-md), 10px)` = `8px`).
- **Keycaps & Circular Indicators (`4px` & `9999px`):** `Kbd` shortcut badges (`4px` / `rounded-sm`); `StageDot` (`6px` circle), `Progress` tracks, offer composition bars, and `7px` custom scrollbars (`9999px` / `rounded-full`).

## Components

Built on `react-aria-components` (`shadcn` `aria-nova`), components share deterministic keyboard navigation, `3px` `:focus-visible` cobalt rings (`ring-ring/50`), and fast `100ms`–`200ms` state transitions.

### Buttons
- **Character:** Compact, tactile monochrome triggers with a `1px` downward press feedback (`active:not-aria-[haspopup]:translate-y-px`).
- **Shape & Sizing:** `10px` (`rounded-lg`) at default `32px` (`h-8 px-2.5`) and `lg` `36px` (`h-9`); `8px` radius at `sm` `28px` (`h-7 px-2.5`, `0.8rem` text) and `xs` `24px` (`h-6 px-2`, `12px` text); square `icon-xs` (`24px`), `icon-sm` (`28px`), and `icon` (`32px`) variants.
- **Variants:** `default` (`--primary` fill, `80%` opacity hover), `outline` (`--background` fill with `--border` stroke, `--muted` hover; `bg-input/30` in dark mode), `secondary` (`--secondary` fill), `ghost` (transparent at rest, `--muted` hover), `destructive` (`10%` crimson wash in light / `20%` in dark with `--destructive` text), and `link` (`underline-offset-4`).

### Chips & Badges
- **StageBadge & StageDot:** `22px`-tall (`h-5.5`) `8px`-rounded outline badge (`px-2`, `12px` medium type) with a `6px` (`size-1.5`) leading `StageDot` across 11 stages: zinc (`Discovered`, `Saved`, `Withdrawn`), dashed zinc (`Ghosted`), blue (`Applied`), violet (`Recruiter Contacted`), purple (`Screening`), amber (`Technical Interview`), orange (`Final Interview`), emerald (`Offer`), and rose (`Rejected`).
- **PriorityBadge & AgendaKindBadge:** `20px`-tall (`h-5`) `PriorityBadge` (`High` rose, `Medium` amber, `Low` zinc) and `22px`-tall `AgendaKindBadge` with semantic dots for all 6 chronological event types.
- **Tag Filter Pills & CompanyAvatar:** Command-bar `#tag` buttons (`22px` height, `8px` radius) toggle from `--card` / `--border` to `border-ring/60 bg-ring/12` when `aria-pressed="true"`. `CompanyAvatar` hashes company names deterministically across 6 translucent hues (`blue`, `emerald`, `amber`, `violet`, `rose`, `cyan`) inside a `10px`-rounded squircle (`24px` `sm`, `32px` `default`, `40px` `lg`).

### Cards / Containers
- **Corner Style:** `18px` outer `CardFrame` tray paired with `14px` inner `CardFramePanel`.
- **Background:** `bg-muted/65` (`dark:bg-muted/35`) on the outer tray; `--card` on the inner panel; `bg-muted/25`–`bg-muted/45` for nested repeatable entries, match banners, and offer breakdowns.
- **Shadow Strategy:** Specular top-edge inner highlight + `1px` grounding shadow on `CardFramePanel` (see Elevation & Depth).
- **Border:** `ring-1 ring-border/80` (`dark:ring-white/[0.07]`) on `CardFrame`; `ring-1 ring-foreground/[0.07]` (`dark:ring-white/[0.08]`) on `CardFramePanel`, with internal rows divided by `divide-border/70`.
- **Internal Padding:** `px-3.5 py-2` (`14px 8px`) on `CardFrameHeader` and `CardFrameFooter`; `16px` (`p-4`) on KPI cells and inspector panels; `20px` (`p-5`) on `OffersDesk` and Sign-In panels.

### Inputs / Fields
- **Style:** `32px`-tall (`h-8`, `36px` `h-9` on Sign-In) `10px`-rounded `Input`, `InputGroup` (with leading `14px`–`16px` icon addons), `SelectTrigger`, and multi-row `Textarea` with `1px solid var(--input)` stroke (`dark:bg-input/30`), stacked below `12px` (`text-xs font-medium`) `<Label>` elements with a `6px` (`gap-1.5`) vertical gap.
- **Focus & Invalid States:** `:focus-visible` (and `InputGroup` focus-within) applies `border-ring` plus a `3px` `ring-ring/50` halo; `aria-invalid` shifts to `border-destructive` with a `3px` `ring-destructive/20` halo.
- **Inline Stage Select (`StageSelectTone`):** Wraps a compact `SelectTrigger` (`size="sm"`, transparent fill, inherited semantic text/border) in the stage's tinted pill classes so pipeline stages mutate in one click directly inside table rows and mobile cards.

### Navigation
- **Inset Sidebar & Breadcrumb Bar:** `SidebarMenu` items (`gap-0.5`) highlight active views with `--sidebar-accent` and `SidebarMenuBadge` tabular counts; `InsetHeaderBar` pairs `SidebarTrigger`, vertical `Separator`, `Workspace › [Page]` breadcrumb, count badge, theme toggle, and conditional collapsed/mobile quick triggers.
- **Segmented View Switcher & Line Tabs:** `ToggleGroup` (`spacing={0}`) renders a recessed `2px`-padded track (`bg-muted/75 border-border/80`) where the selected `Table` or `Board` item lifts to `--background` (`dark:bg-card`) with `shadow-xs`. Inside `EditorSheet`, `TabsList variant="line"` renders horizontal icon+count tabs with a `2px` (`h-0.5`) bottom `--foreground` active indicator bar.
- **Global Command Palette (`CommandDialog`):** Triggered via `⌘K`, anchored at `top-1/3` (`sm:max-w-lg`, `14px` radius), providing instant autocomplete filtering across quick actions, desk navigation, and every tracked application with leading `StageDot` indicators.

### Slide-Over Application Inspector (`EditorSheet`)
A non-destructive right-hand React Aria `Sheet` (`sm:max-w-2xl`) that inspects or creates applications without unmounting the underlying table, board, agenda, or offer filters. Features a live-updating `SheetHeader` (`CompanyAvatar`, role title, `StageBadge`, `PriorityBadge`, `#tag` preview pills, and external posting `LinkButton`), up to 6 contextual tabs (`Overview`, `Rounds & OAs`, `Referrals`, `Offer`, `Resume Match`, `History`), repeatable `EntryCollection` `CardFrame` sections with local Ollama `Draft with AI` referral generation, weighted `Progress` skill-coverage diagnostics, and a sticky `SheetFooter` with two-step `Delete` → `Confirm deletion` safety.

## Do's and Don'ts

### Do:
- **Do** wrap data tables, telemetry KPI strips, offer comparisons, agenda lists, and inspector form sections in the two-layer `CardFrame` + `CardFramePanel` bevel architecture.
- **Do** use `react-aria-components` `<Select>` (and `StageSelectTone` for inline stage pills) for every dropdown so keyboard navigation, popover positioning, and status dots remain consistent.
- **Do** enforce `tabular-nums` on every count badge, KPI figure, date stamp, conversion rate, and `Intl.NumberFormat` ISO-currency package breakdown.
- **Do** inspect and edit applications inside the right-hand `EditorSheet` (`sm:max-w-2xl`) and keep global navigation reachable via `⌘K` (`CommandDialog`), `⌘B` (`Sidebar`), and `N` (`New application`).
- **Do** preserve multi-currency offers in their recorded 3-letter ISO currency codes (`USD`, `INR`, `EUR`, etc.) with proportional stacked composition bars (`--primary` base, `blue-500` bonus, `emerald-500` equity).

### Don't:
- **Don't** render raw native `<select>` elements or write bespoke monolithic CSS overrides outside the Tailwind v4 + `shadcn` OKLCH token layer in `src/index.css`.
- **Don't** apply heavy floating drop shadows, glassmorphic card blurs, or decorative marketing gradients to workspace surfaces; depth comes from `CardFrame` recessed trays, `1px` translucent rings, and top-edge specular highlights.
- **Don't** use circular avatars for companies (`CompanyAvatar` uses `10px` `rounded-lg` squircles) or solid high-saturation fills on status/priority badges (`Ghosted` alone uses a `dashed` border).
- **Don't** replace the main workspace view with a full-screen form route when opening an application—always preserve scroll and filter state via the slide-over `Sheet`.
- **Don't** introduce secondary serif or display font families; rely exclusively on `Geist Variable` weights (`400`–`600`), `-0.025em` heading tracking, and OpenType `cv02`/`cv03`/`cv04`/`cv11` features.
