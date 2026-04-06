# Management Sections — Spacing System

**Internal Engineering Documentation**  
HouseFlow48 Dashboard UI · Design System

---

## Spacing System Name

This document defines the **Management Sections Spacing System (MSSS)**.

Use this name when referencing these rules in PRs, code reviews, comments, or future prompt-driven development tasks.

---

## 1. Overview

"Management Sections" are collapsible card components in the dashboard that allow users to view and manage a list of named entities. They share a common visual structure: a clickable header that expands to reveal a list of items.

**Current Management Sections:**

| Component | Entities Managed |
| :--- | :--- |
| `AccountsCard.tsx` | Bank accounts and wallets |
| `CategoriesCard.tsx` | Spending categories |
| `RecurringTemplatesCard.tsx` | Recurring expense templates |

**Purpose of this document:**

- Define the source-of-truth layout rules for all Management Sections
- Ensure visual consistency across existing and future sections
- Prevent arbitrary spacing drift between components
- Provide a clear tier system so contributors can make spacing decisions without guessing

---

## 2. Mental Model

Before reading the full tier definitions, internalize these two mental models:

- **Base Rule (Tier 1)** → compact, list-like, optimized for fast scanning. Items carry one piece of identity information. The eye moves quickly down the list.
- **Dense Rule (Tier 2)** → card-like, grouped, optimized for readability of complex items. Items carry multiple data points and interactive controls. The eye needs more space to process each entry before moving on.

If you can answer "what tier does this belong to?" before reading Section 5, you have internalized the MSSS correctly.

---

## 3. Layout Structure


Every Management Section follows the same structural skeleton:

```
Card Container
├── Header Button (always visible — collapse/expand trigger)
│   ├── Icon Container
│   ├── Label Group (section type label + section title)
│   └── Chevron Icon (up/down state indicator)
└── Expanded Body (visible only when expanded)
    ├── Item List Wrapper
    │   └── Item × N
    └── CTA Button (optional — "Add new X")
```

Each layer has a defined spacing contract defined by the MSSS (see Section 4).

---

## 4. Spacing System

The MSSS is structured in **two tiers**. Every Management Section must be assigned to exactly one tier based on its item content density (see Section 5 for the decision rule).

---

### Tier 1 — Base Rule (Simple Items)

**Currently applies to:** `AccountsCard`, `CategoriesCard`

**Item content profile:** Each item displays a single line of information — a name plus at most one secondary data point (e.g. a currency symbol or an icon). No inline action button groups.

| Layout Element | Tailwind Classes |
| :--- | :--- |
| **Card container** | `bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm` |
| **Header button** | `w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors` |
| **Header icon container** | `w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500` |
| **Header icon/title gap** | `gap-3` |
| **Expanded body container** | `p-4 border-t border-gray-100 bg-gray-50/30` |
| **Item list wrapper** | `space-y-2 mb-4` |
| **Individual item** | `p-3 rounded-xl` |
| **CTA button** | `w-full py-3 ...` (full-width, dashed border) |

---

### Tier 2 — Dense Rule (Complex Items)

**Currently applies to:** `RecurringTemplatesCard`

**Item content profile:** Each item contains 4–5 distinct data points across at least two lines (e.g. a frequency badge, a name, a calendar day, an account name, a category name) **plus** an inline row of action buttons (e.g. pause/resume, edit, delete).

| Layout Element | Tailwind Classes | Delta from Base |
| :--- | :--- | :--- |
| **Card container** | *(same as Base)* | — |
| **Header button** | *(same as Base)* `px-4 py-3` | — |
| **Header icon container** | *(same as Base)* | — |
| **Expanded body container** | *(same as Base)* `p-4 border-t border-gray-100 bg-gray-50/30` | — |
| **Item list wrapper** | `space-y-3 mb-4` | `space-y-2` → `space-y-3` |
| **Individual item** | `p-4 rounded-xl` | `p-3` → `p-4` |
| **CTA button** | `w-full py-3 ...` (full-width, dashed border) — same as Base Rule (Tier 1) when present | — |

**Why `space-y-3` and not `space-y-4`:**  
`space-y-4` (16px) doubles the base gap without proportional justification. It creates visual islands of content and increases scroll distance on mobile without adding readability value. `space-y-3` (12px) is a single step above the base — enough breathing room for the eye to parse a dense item boundary before encountering the next, without introducing excessive dead space.

**Why `p-4` on individual items:**  
Dense items contain multi-line content and a 3-button action row arranged in a column. The extra 4px of padding on all sides prevents the action buttons from crowding the name and metadata content, which would occur at `p-3`.

---

## 5. Decision Rule

Use the following rule to assign a tier to any **new** Management Section:

> **A section uses the Dense Rule (Tier 2) if its items meet either of the following criteria:**
> 1. Each item displays **3 or more distinct data points**, OR
> 2. Each item contains **one or more inline action buttons** (edit, delete, toggle, etc.)
>
> **Otherwise, use the Base Rule (Tier 1).**

| Criterion | Base Rule (Tier 1) | Dense Rule (Tier 2) |
| :--- | :---: | :---: |
| 1–2 data points per item | ✅ | |
| 3+ data points per item | | ✅ |
| No inline action buttons | ✅ | |
| 1+ inline action buttons | | ✅ |

If both criteria are met, Dense Rule (Tier 2) applies. If neither is met, Base Rule (Tier 1) applies. If only one is met, Dense Rule (Tier 2) should be used and justified in a code comment near the component's item list wrapper.

---

## 6. Visual Consistency Rules

These are **non-negotiable rules** that apply to all sections regardless of tier under the MSSS:

### 6.1 Header

The header button must **always** use:

```
px-4 py-3
```

- `px-4` provides consistent horizontal padding aligned with the expanded body.
- `py-3` produces a compact, uniform header height across all sections. Using `p-4` inflates the header to 16px top/bottom, making it taller than its peers.

### 6.2 Expanded Body

The expanded body container must **always** include:

```
p-4 border-t border-gray-100 bg-gray-50/30
```

- `p-4`: Standard internal padding for the body region.
- `border-t border-gray-100`: Visual separator between the header and expanded content.
- `bg-gray-50/30`: Subtle tint that differentiates the expanded body surface from the card surface. This is a structural visual cue, not a purely decorative one — omitting it makes the section feel unanchored when multiple sections are open simultaneously.

### 6.3 No Arbitrary Values

No spacing values outside the tier definitions above may be introduced. If an edge case seems to require a new value, a deliberate decision must be made:

- Either the new value warrants a new tier definition (update this document)
- Or the existing tier should be applied, and the edge case should be handled by adjusting item-level layout (e.g. flexbox, grid) rather than overall spacing

---

## 7. Anti-Patterns

The following patterns are explicitly forbidden:

| ❌ Anti-Pattern | Why It's Wrong |
| :--- | :--- |
| Using `p-4` in the header button | Makes the header taller than peer sections, breaking vertical rhythm |
| Using `space-y-4` without written tier justification | Overweights inter-item gaps; creates floating islands on mobile |
| Omitting `bg-gray-50/30` from the expanded body | Breaks visual surface consistency when sections are open side by side |
| Using `p-3` for dense items | Compresses multi-line content and action buttons; reduces readability |
| Mixing spacing scales randomly between sections | Prevents the app from feeling like a cohesive system at the dashboard level |
| Adding a new spacing value not defined in this system | Introduces drift; the next contributor has no reference point |

---

## 8. Implementation Notes

### Tailwind-First

All spacing is expressed via existing Tailwind utility classes. No custom CSS, no inline styles, and no CSS variables should be used for Management Section spacing. This keeps spacing auditable directly in component JSX.

### Consistency over Micro-optimization

If a spacing value "almost" works but is not in the tier definition, the correct response is to apply the nearest tier value and submit a proposal to update this document — not to introduce an intermediate one-off value.

### Documenting Exceptions

If a new section truly requires a deviation from Base Rule (Tier 1) or Dense Rule (Tier 2), follow this process:

1. Add a comment in the component's item list wrapper explaining the exception and referencing this document.
2. Open a PR that updates this document with the new justified rule.
3. Do not merge the component change without the documentation update.

### Reference Implementations

| Tier | Reference File |
| :--- | :--- |
| Base Rule (Tier 1) | `src/components/dashboard/AccountsCard.tsx` |
| Base Rule (Tier 1) | `src/components/dashboard/CategoriesCard.tsx` |
| Dense Rule (Tier 2) | `src/components/dashboard/RecurringTemplatesCard.tsx` |

When in doubt about how a tier looks in practice, read the reference implementation directly.

---

## 9. Enforcement

All new or modified Management Sections must comply with the Management Sections Spacing System (MSSS).

Any deviation must:
1. Be explicitly justified in the component code
2. Be documented in this file

Changes that do not meet these criteria must not be merged.
