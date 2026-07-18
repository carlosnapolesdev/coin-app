# Crecik Design System

The single source of truth for how the Crecik UI looks and how new views must be
built. If a screen disagrees with this document, the screen is wrong.

The golden rule: **never reach for a raw color, never reinvent a control.**
Use the semantic tokens and the component library below. This is what keeps every
view consistent across light/dark themes automatically.

---

## 1. Foundations

### 1.1 Color tokens

Color lives in CSS variables (`src/style.css`) and is exposed to Tailwind as
**semantic** color names (`tailwind.config.js`). Each variable holds raw RGB
channels, so opacity modifiers keep working (`bg-primary/10`). The same class
adapts to light and dark automatically — you never write `dark:` for color.

Dark is the **protagonist** mode — designed first, with light as a deliberately
derived secondary. New sessions with no stored theme preference open in dark
(see §6).

| Token            | Tailwind class examples                | Light        | Dark         | Use for |
|------------------|----------------------------------------|--------------|--------------|---------|
| `primary`        | `bg-primary` `text-primary`            | `#5C7A14`    | `#C8FF4D`    | Electric lime accent. **Rationed**: CTAs, the active-nav bar, and positive monetary figures only — never a decorative fill |
| `primary-hover`  | `hover:bg-primary-hover`               | `#4C6710`    | `#B4EA3A`    | Hover for filled primary |
| `primary-fg`     | `text-primary-fg`                      | white        | `#0A0E0C`    | Text/icons **on** a primary fill |
| `bg`             | `bg-bg`                                | `#F6F7F3`    | `#0A0E0C`    | App canvas / page background — warm, not blue-slate |
| `surface`        | `bg-surface`                           | white        | `#121613`    | Cards, panels, modals |
| `surface-2`      | `bg-surface-2`                         | `#EEF0EA`    | `#1B211D`    | Inputs, subtle fills, hover rows |
| `content`        | `text-content`                         | `#14170F`    | `#EDF1EC`    | Primary text |
| `muted`          | `text-muted`                           | `#66706A`    | `#8A968E`    | Secondary text |
| `faint`          | `text-faint`                           | `#99A29B`    | `#57625C`    | Tertiary text, placeholders, idle icons |
| `line`           | `border-line` `divide-line`            | `#E2E5DD`    | `#232A25`    | Borders, dividers |
| `line-strong`    | `border-line-strong`                   | `#CDD2C6`    | `#313A33`    | Stronger borders, dashed CTAs |
| `success`        | `text-success` `bg-success/10`         | `#1F9C67`    | `#3ECF8E`    | Calm teal — generic success state (saved, cleared, confirmed). Deliberately **not** `primary`, so brand accent and generic success never collide |
| `danger`         | `text-danger` `bg-danger/10`           | `#E23F57`    | `#FF5C72`    | Expenses, destructive, errors |
| `warning`        | `text-warning` `bg-warning/10`         | `#B8790A`    | `#FFC24B`    | Pending / caution |
| `info`           | `text-info`                            | `#1E74B8`    | `#4FA8E6`    | Neutral information |
| `overlay`        | `bg-overlay/50` `bg-overlay/60` `bg-overlay/80` | black    | black    | Modal / lightbox / drawer scrim — **theme-agnostic by design** (it sits BETWEEN background and card), used with Tailwind's alpha modifier. Never `bg-slate-950` |
| `overlay-fg`     | `text-overlay-fg` `bg-overlay-fg/10`   | white        | white        | Text/icons **on** the overlay surface (lightbox controls) |
| `scrim`          | `bg-scrim/50` `bg-scrim/60`            | white        | black        | Glass-layer scrim (modal, drawer, celebration) — **theme-dependent on purpose**: a black scrim behind light glass turns it muddy gray and sinks muted-text contrast. The lightbox keeps `overlay` (photos read over dark in both themes) |

**Tinted backgrounds** (badges, soft chips) are always `bg-{status}/10` +
`text-{status}` — never a hard-coded `bg-emerald-100`. The alpha approach is the
only thing that looks right in both themes.

❌ `class="bg-white text-slate-900 border-slate-200"`
✅ `class="bg-surface text-content border-line"`

### 1.1b Chart colors

Data series never use the semantic tokens above (status colors are reserved for
status) and never a raw hex in a component. Eight categorical slots live in
`--chart-1`…`--chart-8` (`src/style.css`), themed per mode, and are consumed via
`chartSeriesColor(slot)` from `src/utils/chartColors.ts` (returns `var(--chart-n)`
for inline styles / SVG strokes).

| Slot | Light     | Dark      |
|------|-----------|-----------|
| 1    | `#5C7A14` | `#75A226` |
| 2    | `#2A78D6` | `#3987E5` |
| 3    | `#EDA100` | `#C98500` |
| 4    | `#4A3AA7` | `#9085E9` |
| 5    | `#159E94` | `#17A091` |
| 6    | `#D14B3A` | `#E0654F` |
| 7    | `#E87BA4` | `#D55181` |
| 8    | `#EB6834` | `#D95926` |

Rules:
- **Order is load-bearing** (colorblind-safety was validated on adjacent pairs):
  assign slots in sequence from slot 1, never shuffle, never skip.
- **Never cycle**: a 9th series folds into an "Other" bucket via
  `foldChartEntries` — extra hues are never invented.
- **Relief rule**: light-mode slots 3 and 7 sit below 3:1 contrast on white by
  design; any chart using them must keep visible direct labels or an adjacent
  labeled breakdown (all current charts do).
- Chart marks carry color; text next to them stays in `text-content`/`text-muted`.

### 1.2 Typography

- Two font roles, locally hosted in `coin-app/public/fonts/` and declared via
  `@font-face` in `src/fonts.css`:
  - **`font-display`** → **Space Grotesk** (weights 500/700). Used sparingly for
    page titles, section/card titles, and large monetary figures — the one place
    this app is allowed to look designed rather than default.
  - **`font-body`** → **Inter**, the default on `body`. Everything else — paragraphs,
    field labels, table cells, button labels, captions — inherits this and never
    needs an explicit class.
- Page title: `font-display text-2xl font-bold text-content` → use the **`PageHeader`** component (already wired).
- Section / card title: `font-display text-sm font-bold text-content`.
- Body: default `text-content`; secondary `text-sm text-muted`.
- Labels / eyebrows: the **`.field-label`** class (`text-xs font-semibold uppercase tracking-wide text-muted`).
- Any numeric column of money (tables, lists) gets `tabular-nums` so digits align
  — see `AnimatedAmount` below for totals specifically.
- **Do not** set titles in ALL CAPS with `font-black tracking-tighter/widest`. Sentence
  case, `font-bold`. Caps are reserved for small labels only.
- **Do not** reach for `font-display` outside titles/section headers/large amounts —
  it's a display face used with restraint, not a replacement for body text.

### 1.3 Radius, shadow, spacing

| Element                     | Radius            |
|-----------------------------|-------------------|
| Controls (button, input)    | `rounded-lg`      |
| Icon tiles                  | `rounded-xl` (`.icon-tile`) |
| Cards, panels, modals       | `rounded-2xl` (`.surface-card`) |
| Pills / badges / avatars    | `rounded-full`    |

- Card elevation: `shadow-card`. Floating layers (modals, popovers): `shadow-elevated`.
- Page padding: `p-6 lg:p-8`. Card padding: `p-6` (use `AppCard`’s `padding` prop).
- Gaps between sections: `gap-6` / `space-y-6`.

### 1.4 Glass surfaces & ambient canvas

Glass comes in exactly **two tiers**, both with centralized fallbacks
(browsers without `backdrop-filter` and `prefers-reduced-transparency: reduce`
get the solid surface):

- **Floating tier — `.surface-glass`** for surfaces that open **over** content:
  modals, menus (user + language), the mobile drawer, toasts, auth form cards.
  Fill `rgb(var(--color-surface) / var(--glass-alpha))` (`0.82` light / `0.75`
  dark) + `blur(var(--glass-blur))` (`14px`). Replaces the
  `border border-line bg-surface shadow-elevated` trio; does **not** set a
  radius — keep the component's own (`rounded-2xl`; toasts `rounded-xl`).
- **Card tier — `.surface-card`** (and therefore `AppCard`): data cards are
  translucent too, but deliberately more opaque and with a lighter blur —
  `--card-alpha` (`0.90` light / `0.85` dark) + `blur(var(--card-blur))`
  (`8px`) — because they carry dense text. Never give a data card the floating
  tier, and never stack one glass tier inside the other expecting extra depth.

Scrim rule: glass-layer scrims use the theme-dependent `scrim` token
(`bg-scrim/50` modal, `/60` drawer — white veil in light, black in dark). The
modal scrim stays full-screen, but the drawer scrim covers **only the area
beside the panel** — a scrim behind a glass panel flattens its backdrop and
kills the effect. On unscrimmed glass (drawer panel), secondary text steps up
from `muted` to `content` (see the drawer's scoped override).

The canvas is what makes glass legible *and* visible: shell roots use
**`.bg-ambient`** (auth screens add `--strong`) — the `bg` color plus two
static radial brand glows. The **logo watermark** (`--wm-logo`: the BrandMark
C-arc + center ring as an inline SVG, stroke at ~4–5% alpha per mode) is
painted **per area, never on the shell**: each region owns its watermark and
clips it at its own edges, so the figure reads as belonging to that pane
rather than to a layer floating over the whole view — `.wm-logo-side`
(Sidebar and mobile drawer, clipped at their right edge), `.wm-logo-main`
(each view's `<main>`: three instances — a large one clipped at the left edge,
offset higher than the sidebar's so the two logos visibly cut at the
sidebar/body divide, plus a top-right one below the sticky `PageHeader` and a
small bottom-right one, each clipped at `<main>`'s own edges) and
`.wm-logo-auth` (auth `<main>`: a large top-right one below the TopHeader and
a small bottom-left one).

Structural bars read as their own translucent panes: Sidebar and TopHeader
use **`.surface-panel`** (`surface` at `--panel-alpha`: `0.50` light / `0.35`
dark, no blur — they sit directly on the canvas), and the sticky `PageHeader`
keeps its `backdrop-blur-md` with a `bg-bg/65` veil.

Everything is static — no animation, no continuous GPU cost. The canvas must
stay *quiet*: no images, no high-contrast decoration — that guarantee is what
makes translucent data cards safe. If text on glass ever fails WCAG contrast,
raise the tier's alpha (caps: `--glass-alpha` `0.85` dark / `0.92` light;
`--card-alpha` `0.92` both) — never lower the blur or stack extra shadows.

---

## 2. Component library (`src/components/ui`)

Import from the barrel: `import { AppButton, PageHeader } from '../ui'`.
Prefer these components over hand-written markup.

### `AppButton`
The only button for actions.
```vue
<AppButton icon="add" @click="open">Add Transaction</AppButton>
<AppButton variant="secondary">Cancel</AppButton>
<AppButton variant="danger" icon="delete">Delete</AppButton>
<AppButton :loading="isSaving" trailing-icon="check">Save Changes</AppButton>
```
- `variant`: `primary` (default) · `secondary` · `ghost` · `danger` · `subtle`
- `size`: `sm` · `md` (default) · `lg`
- `icon` / `trailingIcon`: Material Symbol name · `loading` · `block` · `disabled`

### `AppIconButton`
Square, icon-only action (edit / delete / close in tables and lists).
```vue
<AppIconButton icon="edit" aria-label="Edit" @click="edit(row)" />
<AppIconButton icon="delete" variant="danger" aria-label="Delete" @click="remove(row)" />
```
`variant`: `default` · `danger` · `primary`. `size`: `sm` · `md`.

### `PageHeader`
Every full page starts with this. Title + subtitle on the left, actions slot on the right.
```vue
<PageHeader title="Transactions" subtitle="Your financial ledger">
  <template #actions>
    <AppButton icon="add" @click="openCreate">Add Transaction</AppButton>
  </template>
</PageHeader>
```

### `AppCard`
Standard surface container. `padding`: `none` · `sm` · `md` (default) · `lg`.
```vue
<AppCard>…</AppCard>
<AppCard padding="none"><!-- tables / custom headers --></AppCard>
```

### `AppModal`
The only modal shell. Consistent scrim, container, header (icon + title + close) and footer.
```vue
<AppModal :is-open="open" title="Add Transaction" icon="receipt_long" size="md" @close="close">
  <form id="my-form" class="p-6 lg:p-8 space-y-6">…</form>
  <template #footer>
    <AppButton variant="ghost" @click="close">Close</AppButton>
    <AppButton type="submit" form="my-form" :loading="saving">Save</AppButton>
  </template>
</AppModal>
```
`size`: `sm` · `md` · `lg` · `xl`. The footer right-aligns its buttons on desktop.

### `AppBadge`
Status pill. `variant`: `success` · `danger` · `warning` · `primary` · `muted`.
```vue
<AppBadge variant="success" icon="check_circle">Cleared</AppBadge>
```

### `AnimatedAmount`
The signature treatment for a **total** monetary figure — the app's one deliberate
moment of personality. Counts up on mount (or on change) and shows a lime glow
(dark) / tinted underline (light) when the value is non-zero. `size="lg"`
(default) is for hero totals (dashboard balance, account balances, category
totals); `size="md"` is for small inline readouts and drops the glow/underline
on purpose so the emphasis doesn't get diluted through repetition.
```vue
<AnimatedAmount :value="monthlyIncome" />
<AnimatedAmount :value="currentBalanceDisplay" size="md" :show-sign="false" />
```
- `value` (required): signed number. Sign determines the tone automatically —
  positive → `primary` (lime) with a `+`, negative → `danger` with a `-`, zero → `content`, no emphasis.
- `size`: `md` · `lg` (default).
- `currencySymbol`: default `'$'`.
- `showSign`: default `true`.
- **Never** use this for row-level or list-level figures (transaction tables,
  per-category breakdowns) — the animated/glow treatment is reserved for totals
  only, so it doesn't turn into visual noise through repetition. Those stay
  plain text with `tabular-nums`.

### `AppInput` / `AppSelect` / `AppTextarea`
`v-model`-friendly form fields wired to the `.field-input` look, with label/icon/error.
```vue
<AppInput v-model="name" label="Account Name" icon="badge" placeholder="Main Savings" />
```
For large existing forms it is also fine to use a native `<input>`/`<select>` with the
`.field-input` class directly (see §3.2) — both render identically.

### `AppSpinner`
Loading indicator; inherits the current text color. `size`: `sm` · `md` · `lg`.
```vue
<div class="text-primary"><AppSpinner size="lg" /></div>
```

### `BrandMark`
The Crecik logo lockup (icon tile + wordmark). The only place the brand mark is defined.
```vue
<BrandMark :subtitle="user.email" />
<BrandMark :wordmark="false" />
```

### `ThemeToggle`
Light/dark switch. Already placed in the Sidebar footer and TopHeader.

---

## 3. Utility classes (`@layer components` in `style.css`)

For hand-written markup (tables, bespoke layouts) so it stays on-system:

| Class             | What it is |
|-------------------|------------|
| `.surface-card`   | `rounded-2xl border border-line shadow-card` + translucent `surface` fill (`--card-alpha`) with 8px backdrop blur — the card glass tier (see §1.4) |
| `.surface-glass`  | floating-layer surface: `line/60` border + translucent `surface` fill + backdrop blur + `shadow-elevated` (no radius — see §1.4) |
| `.bg-ambient` (+ `.bg-ambient--strong`) | canvas with static brand glows; shell roots use the base class, auth screens add `--strong` |
| `.surface-panel`  | translucent structural pane (`surface` × `--panel-alpha`, no blur) — Sidebar, TopHeader |
| `.wm-logo-side` / `.wm-logo-main` / `.wm-logo-auth` | per-area logo watermark, clipped by the area's own edges (see §1.4) |
| `.field-label`    | uppercase micro-label above a field |
| `.field-input`    | shared look for `input`, `select`, `textarea` (add `pl-11` when prefixing an icon) |
| `.badge` + `.badge-{success\|danger\|warning\|primary\|muted}` | status pills |
| `.icon-tile`      | centered rounded container for an icon (`size-10` etc.) |
| `.data-th`        | table header cell |
| `.nav-link` / `.nav-link-active` | sidebar items |

### 3.1 Table pattern
```html
<div class="surface-card overflow-hidden">
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead><tr class="border-b border-line bg-surface-2/50">
        <th class="data-th">Date</th> …
      </tr></thead>
      <tbody class="divide-y divide-line">
        <tr class="group transition-colors hover:bg-surface-2"> … </tr>
      </tbody>
    </table>
  </div>
</div>
```
Row actions live in a `flex gap-1 opacity-0 group-hover:opacity-100` cell using `AppIconButton`.

### 3.2 Field pattern
```html
<div>
  <label class="field-label">Amount</label>
  <div class="relative">
    <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint">attach_money</span>
    <input v-model="amount" class="field-input pl-11" type="number" />
  </div>
</div>
```

### 3.3 Segmented control (tabs / toggles)
```html
<div class="inline-flex rounded-lg border border-line bg-surface-2 p-1">
  <button class="rounded-md px-5 py-2 text-sm font-semibold transition"
          :class="active ? 'bg-surface text-content shadow-sm' : 'text-muted hover:text-content'">…</button>
</div>
```

### 3.4 Empty / loading / error states
- Loading: centered `AppSpinner` in a `text-primary` wrapper.
- Empty: muted Material icon + `text-content` headline + `text-muted` hint (+ optional `AppButton`).
- Error: `text-danger` icon + message + a `secondary` **Retry** `AppButton`.

---

## 4. Page layout

Every authenticated screen follows the same skeleton:
```vue
<div class="flex h-screen overflow-hidden bg-bg">
  <Sidebar />
  <main class="flex-1 overflow-y-auto">
    <PageHeader title="…" subtitle="…">
      <template #actions> … </template>
    </PageHeader>
    <div class="p-6 lg:p-8 space-y-6"> … </div>
  </main>
</div>
```
- The **Sidebar** is a translucent pane (`.surface-panel .wm-logo-side`) over
  the shell's ambient canvas: a light `surface` tint plus its own clipped logo
  watermark give it identity as a distinct pane, separated by the `border-r`.
- The **Sidebar** owns primary navigation, the brand, Sign Out and the theme toggle.
  Do **not** add page-specific action buttons to the sidebar — they belong in the
  `PageHeader` actions slot of the relevant view.
- Active nav uses one style only: `.nav-link-active` — a thin `primary`-colored
  left accent bar (`before:` pseudo-element) plus tinted text/icon. No filled-pill
  background, no right-border, bottom-border or dark-pill variants.

---

## 5. Icons & copy

- Icons: **Material Symbols Outlined** only.
- The “add / create” action is always the **`add`** icon (a single plain plus).
  Never mix in `add_circle` / `add_box` for the same intent.
- One brand icon everywhere: `account_balance_wallet` (via `BrandMark`).
- UI copy is **English**, sentence case. Action labels are verbs: “Add Transaction”,
  “New Category”, “Save Changes”.
- No fabricated content (fake testimonials, invented partner brands, made-up metrics).

---

## 6. Theming

- `darkMode: 'class'`. The `.dark` class on `<html>` is set before paint by an inline
  script in `index.html` (prevents a flash) and toggled by `useTheme()`
  (`src/composables/useTheme.ts`), which persists to `localStorage`.
- **Dark is the default.** When no theme is stored yet, the app opens in dark —
  not the OS `prefers-color-scheme`. Both the inline script and
  `resolveInitialTheme()` in `useTheme.ts` implement this the same way (`theme
  !== 'light'` → dark) and must be kept in sync, or first load can flash the
  wrong theme.
- Because color is token-based, components need **no** `dark:` color variants. If you
  catch yourself writing `dark:bg-slate-800`, replace both sides with a token instead.
  The one sanctioned exception is presence/absence of an effect that's
  qualitatively different per mode (e.g. `AnimatedAmount`'s glow-in-dark /
  underline-in-light split) — that's a structural difference, not a duplicated color.

---

## 7. Checklist for a new view

1. `bg-ambient` root (`bg-ambient bg-ambient--strong` on auth screens), `Sidebar`, scrollable `<main>`.
2. Start with `PageHeader` (title + subtitle, actions in the slot).
3. Group content in `AppCard` / `.surface-card`; cards are `rounded-2xl`.
4. All controls via `AppButton` / `AppIconButton`; the add action uses `icon="add"`.
5. Inputs use `.field-input` + `.field-label` (or `AppInput`).
6. Colors are tokens only — no raw `slate-*`, `white`, `emerald-*`, hard `#hex`.
7. Provide loading / empty / error states (see §3.4).
8. No `dark:` color classes, no ALL-CAPS titles, no sidebar action buttons.
9. Titles/section headers use `font-display`; everything else inherits `font-body`.
10. Totals use `AnimatedAmount`; row/list-level money stays plain text with `tabular-nums`.
11. `npm run build` must pass with zero type errors.
12. Floating layers (modals, menus, drawer, toasts) use `.surface-glass`; data cards stay on `.surface-card` (the more-opaque card tier) — never swap tiers (§1.4).
