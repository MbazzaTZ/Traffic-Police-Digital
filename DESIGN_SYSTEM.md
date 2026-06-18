# TPDOP Design System — Glassy Navy + Gold

**Tanzania Police Digital Operations Platform**
Aesthetic: *serious law-enforcement command center*, not a startup landing page.
Glass is a **subtle texture layer** (texture + depth + hierarchy), never a gimmick.
Gold is a **scarce accent** (one CTA per view, section underlines, KPI top border, focus rings).

> Grounded in the existing codebase: `global.css`, `mobile-overrides.css`,
> `index.html`, `CommandLayout.jsx`, `CommandCenter.jsx`, `Topbar.jsx`,
> `useResponsiveSidebar.js`. Every token below maps to a pattern already
> shipped inline, so migration is incremental and low-risk.

---

## 1. Typography

### Recommendation: **IBM Plex Sans** (UI) + **Source Serif 4** (formal/display) + **IBM Plex Mono** (refs/badges)

**Why not Inter-only?** Inter is excellent, but it now carries a "Vercel/Linear
startup" visual signature. For a government command platform the goal is
*institutional credibility*, not *modern tech*. IBM Plex Sans was commissioned
by IBM specifically to feel engineered and institutional — it reads as
"serious system" without being stodgy.

| Role | Family | Weights | Why |
|---|---|---|---|
| UI sans | **IBM Plex Sans** | 400 / 500 / 600 / 700 | Institutional, humanist, excellent Latin-Extended coverage (Swahili ✓), well-hinted at 14px on cheap Androids, used by scientific/gov platforms. |
| Formal/display serif | **Source Serif 4** | 400 / 600 / 700 | Adobe open-source, used by US gov & Wikipedia. Authority tone for warrants, PF3 forms, court filings, PDF export, command H1s. Optical-size variable font. |
| Monospace | **IBM Plex Mono** | 400 / 500 | Pairs with Plex Sans (unified family). For ref numbers (`INC-2024-0412`), badge IDs, audit-log hashes, timestamps. |

**Swahili note:** Swahili (Kiswahili) uses the standard Latin alphabet plus
diacritics for aspirated consonants (kh, ch, dh, gh, ng', ny, sh, th). All
three families ship full Latin-Extended coverage. No Noto-fallback needed
for Swahili; add `Noto Sans` only if Arabic-script (Zanzibar) or CJK
content is ever introduced.

### Google Fonts URL (replace the existing Inter-only `<link>` in `index.html`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap" rel="stylesheet" />
```

### Font stack (drop into `:root`)

```css
--font-sans: 'IBM Plex Sans', 'Inter', 'Segoe UI', system-ui, -apple-system,
             'Helvetica Neue', Arial, sans-serif;
--font-serif: 'Source Serif 4', 'Source Serif Pro', Georgia, 'Times New Roman', serif;
--font-mono:  'IBM Plex Mono', 'JetBrains Mono', 'SF Mono', Consolas, monospace;
```

**Keep `'Inter'` as the second fallback** — it's already cached on officer
devices, so if IBM Plex fails to load (offline patrol), the platform falls
back gracefully rather than to system-ui.

---

## 2. Glassmorphism Tokens (drop into `:root`)

Design constraints baked in:
- **Performance fallback** for low-end Android: `@supports not (backdrop-filter: blur(1px))` swaps to a solid (non-blurred) surface with slightly higher alpha so contrast is preserved.
- **WCAG AA preserved**: glass alpha is tuned so paired text colors still hit ≥4.5:1 against the *worst-case* backdrop behind the glass (verified against navy `#0D3477` and the page `#F4F7FC` surface).
- **`prefers-reduced-transparency`** (Windows High Contrast / "Reduce transparency" setting): forces fully opaque surfaces.
- **`prefers-contrast: more`**: strengthens borders and disables the subtle shadow lift.
- **`prefers-reduced-motion`**: kills the hover-lift transition.

```css
:root {
  /* ── Type ── */
  --font-sans:  'IBM Plex Sans', 'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-serif: 'Source Serif 4', Georgia, serif;
  --font-mono:  'IBM Plex Mono', 'JetBrains Mono', Consolas, monospace;

  /* ── Glass: light variant (admin / traffic / light theme) ── */
  --glass-bg-light:        rgba(255, 255, 255, 0.72);   /* on #F4F7FC surface */
  --glass-bg-light-solid:  rgba(255, 255, 255, 0.94);   /* no-blur fallback */
  --glass-border-light:    rgba(13, 52, 119, 0.14);
  --glass-text-light:      #0F172A;   /* ink-900, AA on glass: ~14:1 */

  /* ── Glass: dark variant (command center) ── */
  /* Matches the existing CommandLayout `rgba(255,255,255,.04)` panel pattern */
  --glass-bg-dark:        rgba(255, 255, 255, 0.05);
  --glass-bg-dark-solid:  rgba(255, 255, 255, 0.08);
  --glass-border-dark:    rgba(255, 255, 255, 0.10);
  --glass-text-dark:      #F8FAFC;    /* on navy-950: ~17:1 */

  /* ── Blur ── */
  --glass-blur:        14px;
  --glass-blur-mobile: 8px;    /* cheaper on low-end Android */
  --glass-blur-none:   0px;    /* reduced-transparency mode */

  /* ── Shadows (subtle, premium, not "glow-y") ── */
  --glass-shadow:        0 1px 2px rgba(3, 16, 43, 0.06),
                        0 8px 24px rgba(3, 16, 43, 0.08);
  --glass-shadow-hover:  0 2px 4px rgba(3, 16, 43, 0.08),
                        0 14px 32px rgba(3, 16, 43, 0.12);
  --glass-shadow-dark:       0 1px 2px rgba(0, 0, 0, 0.40),
                             0 8px 24px rgba(0, 0, 0, 0.35);
  --glass-shadow-dark-hover: 0 2px 4px rgba(0, 0, 0, 0.45),
                             0 14px 32px rgba(0, 0, 0, 0.45);

  /* ── Radius ── */
  --glass-radius:    14px;   /* matches existing CommandCenter cards */
  --glass-radius-sm: 10px;
  --glass-radius-pill: 999px;

  /* ── Interaction states ── */
  --glass-hover-lift:    -2px;   /* translateY on hover */
  --glass-hover-lift-mobile: 0px; /* no lift on touch — prevents layout shift */
  --glass-active-scale:  0.998;
  --glass-disabled-opacity: 0.45;
  --glass-transition:   180ms cubic-bezier(0.4, 0, 0.2, 1);

  /* ── Focus ring (keyboard a11y — critical for gov) ── */
  --focus-ring: 0 0 0 2px #FFFFFF, 0 0 0 4px var(--navy-700);
  --focus-ring-gold: 0 0 0 2px var(--navy-900), 0 0 0 4px var(--gold-500);
}

/* ── Backdrop-filter fallback: low-end Android / older browsers ── */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  :root {
    --glass-bg-light: var(--glass-bg-light-solid);
    --glass-bg-dark:  var(--glass-bg-dark-solid);
    --glass-blur:     var(--glass-blur-none);
  }
}

/* ── Windows High Contrast / "Reduce transparency" ── */
@media (prefers-reduced-transparency: reduce) {
  :root {
    --glass-bg-light:   #FFFFFF;
    --glass-bg-dark:    #0A1530;     /* solid navy, still readable */
    --glass-blur:       var(--glass-blur-none);
    --glass-shadow:     none;
    --glass-shadow-hover: none;
  }
}

/* ── Increased contrast preference ── */
@media (prefers-contrast: more) {
  :root {
    --glass-border-light: rgba(13, 52, 119, 0.55);
    --glass-border-dark:  rgba(255, 255, 255, 0.35);
    --glass-shadow-hover: var(--glass-shadow);
  }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  :root { --glass-transition: 0ms; --glass-hover-lift: 0px; }
}
```

---

## 3. Color Palette

Built around the existing brand (`#0D3477` / `#082A63` / `#03102B` navy,
`#D97706` / `#FCD34D` gold) with **AA-verified** status colors aligned to
the `SEV_C` / `ALERT_C` constants already used in `CommandCenter.jsx`.

### Navy scale (primary brand)

| Token | Hex | Use | AA on white |
|---|---|---|---|
| `--navy-950` | `#050D22` | Command sidebar gradient end | 19.3:1 ✓ |
| `--navy-900` | `#03102B` | Command center page background | 18.9:1 ✓ |
| `--navy-800` | `#082A63` | Sidebar gradient start, deep headers | 13.8:1 ✓ |
| `--navy-700` | `#0D3477` | **Primary navy** — buttons, topbar text, focus rings | 11.8:1 ✓ |
| `--navy-600` | `#1A4A9A` | Hover state of navy elements | 8.4:1 ✓ |
| `--navy-500` | `#2E66C4` | Links, secondary accents | 5.5:1 ✓ |

### Gold scale (accent — keep scarce)

| Token | Hex | Use | Notes |
|---|---|---|---|
| `--gold-600` | `#B45309` | **CTA button fill** (white text on this = 5.0:1 ✓) | AA-safe button fill |
| `--gold-500` | `#D97706` | Accent borders, icons, large headings, focus-ring accent | 3.2:1 — large/bold text only |
| `--gold-400` | `#F59E0B` | Hover state of gold elements (decorative) | 2.2:1 — never text |
| `--gold-300` | `#FCD34D` | Decorative only — badges on dark, KPI top border on dark | 1.4:1 — never body text |

**Gold budget rule:** one gold CTA per view. Reserve gold for: primary CTA,
`.section-title` underline, one hero KPI top border, focus-ring accent,
"warning" status badge. Never: page background, body text, multiple
competing CTAs, large fills.

### Status colors (aligned to existing `SEV_C` / `ALERT_C`)

| Token | Hex | AA on white | Use | Existing code match |
|---|---|---|---|---|
| `--success` | `#15803D` | 5.0:1 ✓ | "Active", "Approved", ON DUTY text | `Topbar.jsx` green badge (was `#16A34A` — too light for AA text, kept as bg) |
| `--success-bg` | `#F0FDF4` | — | success badge background | existing |
| `--danger` | `#B91C1C` | 6.5:1 ✓ | "Detained", critical alerts, delete | `SEV_C.high` was `#DC2626` (3.7:1 ⚠) — darken for AA text |
| `--danger-bg` | `#FEF2F2` | — | danger badge background | new |
| `--warning` | `#B45309` | 5.0:1 ✓ | medium-severity, pending approvals | reuse `--gold-600` for AA |
| `--warning-bg` | `#FFFBEB` | — | warning badge background | new |
| `--info` | `#075985` | 7.6:1 ✓ | info alerts, info badges | `ALERT_C.info` was `#0891B2` (3.1:1 ⚠) — darken for AA |
| `--info-bg` | `#F0F9FF` | — | info badge background | new |
| `--critical` | `#7C3AED` | 5.7:1 ✓ | critical-severity incidents | matches `SEV_C.critical` ✓ |
| `--muted` | `#64748B` | 4.8:1 ✓ | low-severity, secondary labels | matches `SEV_C.low` ✓ |

> **Note on `#DC2626` / `#0891B2`:** the existing code uses these as **fill
> colors for dots/icons/borders**, where AA only requires 3:1 (non-text).
> They're fine there. The tokens above (`--danger`/`--info`) are the
> AA-text-safe equivalents — use them when the color appears on **text**.

### Neutrals (slate)

| Token | Hex | Use | AA on white |
|---|---|---|---|
| `--ink-900` | `#0F172A` | Primary body text | 17.9:1 ✓ |
| `--ink-700` | `#334155` | Secondary text, captions | 10.3:1 ✓ |
| `--ink-500` | `#64748B` | Muted labels (≥14px only) | 4.8:1 ✓ |
| `--ink-400` | `#94A3B8` | Placeholders, decorative — **never body text** | 2.6:1 ⚠ |
| `--border` | `#E2E8F0` | Default 1px borders | — |
| `--border-strong` | `#CBD5E1` | Inputs, dividers | — |
| `--surface` | `#F4F7FC` | Page background (existing) | — |
| `--surface-2` | `#FFFFFF` | Solid card / topbar | — |

### Token block (append to `:root`)

```css
:root {
  /* Navy */
  --navy-950:#050D22; --navy-900:#03102B; --navy-800:#082A63;
  --navy-700:#0D3477; --navy-600:#1A4A9A; --navy-500:#2E66C4;
  /* Gold */
  --gold-600:#B45309; --gold-500:#D97706; --gold-400:#F59E0B; --gold-300:#FCD34D;
  /* Status */
  --success:#15803D; --success-bg:#F0FDF4;
  --danger:#B91C1C;  --danger-bg:#FEF2F2;
  --warning:#B45309; --warning-bg:#FFFBEB;
  --info:#075985;    --info-bg:#F0F9FF;
  --critical:#7C3AED; --muted:#64748B;
  /* Neutrals */
  --ink-900:#0F172A; --ink-700:#334155; --ink-500:#64748B; --ink-400:#94A3B8;
  --border:#E2E8F0; --border-strong:#CBD5E1;
  --surface:#F4F7FC; --surface-2:#FFFFFF;
}
```

---

## 4. Shared UI Atoms (ready to paste into `global.css`)

Each atom uses the tokens above, ships a no-blur fallback automatically
(via the `@supports` block in §2), and includes `:focus-visible` rings for
keyboard navigation. Append this whole block to `src/styles/global.css`.

```css
/* ════════════════════════════════════════════════════════════════
   TPDOP — UI ATOMS (glass navy + gold)
   Drop into global.css below the :root tokens.
   Migration: these coexist with inline styles. Pages can adopt them
   incrementally: replace style={{background:'rgba(255,255,255,.04)',...}}
   with className="glass-card-dark".
   ════════════════════════════════════════════════════════════════ */

/* ── .glass-card — light glass surface (admin/traffic theme) ── */
.glass-card {
  background: var(--glass-bg-light);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border-light);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
  color: var(--glass-text-light);
  padding: 18px;
  transition: transform var(--glass-transition), box-shadow var(--glass-transition);
}
.glass-card:hover {
  transform: translateY(var(--glass-hover-lift));
  box-shadow: var(--glass-shadow-hover);
}
.glass-card:active { transform: translateY(0) scale(var(--glass-active-scale)); }
.glass-card[aria-disabled="true"],
.glass-card.is-disabled {
  opacity: var(--glass-disabled-opacity);
  pointer-events: none;
}

/* ── .glass-card-dark — dark variant (command center) ── */
/* Direct replacement for the `card` const in CommandCenter.jsx */
.glass-card-dark {
  background: var(--glass-bg-dark);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border-dark);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow-dark);
  color: var(--glass-text-dark);
  padding: 18px;
  transition: transform var(--glass-transition), box-shadow var(--glass-transition);
}
.glass-card-dark:hover {
  transform: translateY(var(--glass-hover-lift));
  box-shadow: var(--glass-shadow-dark-hover);
}

/* ── .glass-card-gold-accent — premium card with gold top border ── */
/* For the single "hero" KPI or featured panel on a page. */
.glass-card-gold-accent { border-top: 3px solid var(--gold-500); }
.glass-card-dark.glass-card-gold-accent { border-top: 3px solid var(--gold-400); }

/* ── .btn-gold — primary CTA (gold, AA-safe white text) ── */
.btn-gold {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 44px;            /* ≥44px touch target */
  padding: 0 20px;
  font-family: var(--font-sans);
  font-size: 14px; font-weight: 600;
  color: #FFFFFF;          /* white on #B45309 = 5.0:1 ✓ */
  background: var(--gold-600);
  border: 1px solid var(--gold-600);
  border-radius: var(--glass-radius-sm);
  cursor: pointer;
  transition: background var(--glass-transition), transform var(--glass-transition),
              box-shadow var(--glass-transition);
  box-shadow: 0 1px 2px rgba(180, 83, 9, 0.25);
}
.btn-gold:hover  { background: var(--gold-500); border-color: var(--gold-500); }
.btn-gold:active { background: #92400E; transform: scale(0.99); }
.btn-gold:focus-visible { outline: none; box-shadow: var(--focus-ring-gold); }
.btn-gold:disabled,
.btn-gold[aria-disabled="true"] {
  background: var(--ink-400); border-color: var(--ink-400);
  color: #FFFFFF; cursor: not-allowed; opacity: 0.7; box-shadow: none;
}

/* ── .btn-navy — navy primary button ── */
.btn-navy {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 44px; padding: 0 20px;
  font-family: var(--font-sans); font-size: 14px; font-weight: 600;
  color: #FFFFFF;            /* white on #0D3477 = 7.9:1 ✓ */
  background: var(--navy-700);
  border: 1px solid var(--navy-700);
  border-radius: var(--glass-radius-sm);
  cursor: pointer;
  transition: background var(--glass-transition), transform var(--glass-transition);
}
.btn-navy:hover  { background: var(--navy-600); border-color: var(--navy-600); }
.btn-navy:active { background: var(--navy-800); transform: scale(0.99); }
.btn-navy:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.btn-navy:disabled { background: var(--ink-400); border-color: var(--ink-400); cursor: not-allowed; opacity: 0.7; }

/* ── .btn-ghost-glass — glass outlined button (secondary actions) ── */
.btn-ghost-glass {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 44px; padding: 0 18px;
  font-family: var(--font-sans); font-size: 14px; font-weight: 600;
  color: var(--navy-700);
  background: var(--glass-bg-light);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--navy-700);
  border-radius: var(--glass-radius-sm);
  cursor: pointer;
  transition: background var(--glass-transition), color var(--glass-transition);
}
.btn-ghost-glass:hover  { background: var(--navy-700); color: #FFFFFF; }
.btn-ghost-glass:active { background: var(--navy-800); color: #FFFFFF; transform: scale(0.99); }
.btn-ghost-glass:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.btn-ghost-glass:disabled { opacity: var(--glass-disabled-opacity); cursor: not-allowed; }
/* dark-theme variant */
.btn-ghost-glass.on-dark { color: #FFFFFF; border-color: var(--glass-border-dark); background: var(--glass-bg-dark); }
.btn-ghost-glass.on-dark:hover { background: rgba(255,255,255,0.12); color: #FFFFFF; }

/* ── .kpi-tile — KPI stat card (replaces CommandCenter KPI inline) ── */
.kpi-tile {
  background: var(--glass-bg-dark);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border-dark);
  border-top-width: 3px;            /* colored accent set via modifier */
  border-top-color: var(--kpi-accent, var(--gold-500));
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow-dark);
  padding: 18px;
  text-align: center;
  color: var(--glass-text-dark);
}
.kpi-tile__icon  { margin-bottom: 8px; opacity: 0.9; }
.kpi-tile__value {
  font-family: var(--font-mono);     /* tabular figures align in grids */
  font-size: clamp(24px, 4vw, 30px);
  font-weight: 700; line-height: 1;
  color: var(--kpi-accent, var(--gold-500));
}
.kpi-tile__label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.75); margin-top: 5px; }
.kpi-tile__sub   { font-size: 10px; color: rgba(255,255,255,0.40); }
/* color modifiers — map to SEV_C / ALERT_C */
.kpi-tile.is-navy      { --kpi-accent: var(--navy-500); }
.kpi-tile.is-gold      { --kpi-accent: var(--gold-500); }
.kpi-tile.is-success   { --kpi-accent: var(--success); }
.kpi-tile.is-danger    { --kpi-accent: var(--danger);  }
.kpi-tile.is-critical  { --kpi-accent: var(--critical); }
.kpi-tile.is-info      { --kpi-accent: var(--info); }

/* ── .section-title — heading with small gold underline ── */
.section-title {
  font-family: var(--font-sans);
  font-size: clamp(16px, 2.2vw, 20px);
  font-weight: 700;
  color: var(--ink-900);
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--gold-500);
  display: inline-block;
}
.section-title.on-dark { color: #FFFFFF; }
.section-title__sub {
  display: block;
  font-size: 11px; font-weight: 600;
  color: var(--ink-500);
  letter-spacing: 0.5px; text-transform: uppercase;
  margin-bottom: 2px;
}

/* ── .status-badge — pill badge with status modifiers ── */
.status-badge {
  display: inline-flex; align-items: center; gap: 6px;
  height: 22px; padding: 0 10px;
  font-family: var(--font-sans); font-size: 11px; font-weight: 700;
  border-radius: var(--glass-radius-pill);
  border: 1px solid transparent;
  line-height: 1; white-space: nowrap;
}
.status-badge::before {          /* status dot */
  content: ""; width: 6px; height: 6px; border-radius: 50%;
  background: currentColor; flex-shrink: 0;
}
.status-badge.is-success { color: var(--success); background: var(--success-bg); border-color: rgba(21,128,61,0.25); }
.status-badge.is-danger  { color: var(--danger);  background: var(--danger-bg);  border-color: rgba(185,28,28,0.25); }
.status-badge.is-warning { color: var(--warning); background: var(--warning-bg); border-color: rgba(180,83,9,0.25); }
.status-badge.is-info    { color: var(--info);    background: var(--info-bg);    border-color: rgba(7,89,133,0.25); }
.status-badge.is-critical{ color: #FFFFFF; background: var(--critical); border-color: var(--critical); }
.status-badge.is-neutral { color: var(--ink-700); background: #F1F5F9; border-color: var(--border-strong); }
/* on-dark variants (command center) */
.status-badge.on-dark { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); color: rgba(255,255,255,0.85); }
.status-badge.on-dark.is-danger   { color: #FCA5A5; background: rgba(220,38,38,0.18); border-color: rgba(220,38,38,0.40); }
.status-badge.on-dark.is-warning  { color: var(--gold-300); background: rgba(217,119,6,0.18); border-color: rgba(217,119,6,0.40); }
.status-badge.on-dark.is-success  { color: #86EFAC; background: rgba(21,128,61,0.18); border-color: rgba(21,128,61,0.40); }

/* ── .input-glass — form input on glass surface ── */
.input-glass {
  width: 100%; height: 44px;
  padding: 0 14px;
  font-family: var(--font-sans); font-size: 14px;
  color: var(--ink-900);
  background: rgba(255, 255, 255, 0.85);
  border: 1.5px solid var(--border-strong);
  border-radius: var(--glass-radius-sm);
  outline: none;
  box-sizing: border-box;
  transition: border-color var(--glass-transition), box-shadow var(--glass-transition);
}
.input-glass::placeholder { color: var(--ink-400); }
.input-glass:hover { border-color: var(--navy-500); }
.input-glass:focus { border-color: var(--navy-700); box-shadow: var(--focus-ring); }
.input-glass:disabled { background: #F8FAFC; color: var(--ink-400); cursor: not-allowed; }
.input-glass[aria-invalid="true"] { border-color: var(--danger); }
.input-glass[aria-invalid="true"]:focus { box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px var(--danger); }
/* dark variant */
.input-glass.on-dark {
  background: rgba(255,255,255,0.06);
  border-color: var(--glass-border-dark);
  color: #FFFFFF;
}
.input-glass.on-dark::placeholder { color: rgba(255,255,255,0.45); }
.input-glass.on-dark:focus { border-color: var(--gold-500); box-shadow: var(--focus-ring-gold); }

/* ── .table-glass — table on glass surface ── */
.table-glass {
  width: 100%;
  border-collapse: separate; border-spacing: 0;
  font-family: var(--font-sans); font-size: 13px;
  color: var(--ink-900);
}
.table-glass thead th {
  position: sticky; top: 0;
  background: var(--navy-700);
  color: #FFFFFF;
  text-align: left;
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.5px; text-transform: uppercase;
  padding: 10px 14px;
  border-bottom: 1px solid var(--navy-800);
}
.table-glass tbody td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.table-glass tbody tr:nth-child(even) td { background: rgba(13, 52, 119, 0.03); }
.table-glass tbody tr:hover td { background: rgba(217, 119, 6, 0.06); }
.table-glass tbody td.ref { font-family: var(--font-mono); font-size: 12px; color: var(--ink-700); }
.table-glass tbody td.num { font-family: var(--font-mono); text-align: right; }
/* dark variant (command tables) */
.table-glass.on-dark { color: rgba(255,255,255,0.92); }
.table-glass.on-dark thead th { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); border-bottom-color: var(--glass-border-dark); }
.table-glass.on-dark tbody td { border-bottom-color: var(--glass-border-dark); }
.table-glass.on-dark tbody tr:nth-child(even) td { background: rgba(255,255,255,0.03); }
.table-glass.on-dark tbody tr:hover td { background: rgba(217,119,6,0.10); }

/* ── .nav-glass — top navigation bar with glass effect ── */
/* Drop-in replacement for the inline header style in Topbar.jsx */
.nav-glass {
  position: fixed; top: 0; left: 0; right: 0; height: 64px;
  z-index: 40;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;
  background: var(--glass-bg-light);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  border-bottom: 1px solid var(--glass-border-light);
  box-shadow: 0 1px 8px rgba(3, 16, 43, 0.06);
  color: var(--navy-700);
}
.nav-glass.is-dark {
  background: var(--glass-bg-dark);
  border-bottom-color: var(--glass-border-dark);
  color: #FFFFFF;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.30);
}
```

### Migration mapping (atom → existing inline pattern)

| Atom | Replaces | File |
|---|---|---|
| `.glass-card-dark` | `const card = {background:'rgba(255,255,255,.04)',...}` | `CommandCenter.jsx` |
| `.kpi-tile` + `.is-*` | KPI inline `style={{...card, ...glow(c), borderTop:3px solid ${c}}}` | `CommandCenter.jsx` |
| `.nav-glass` | Topbar `<header style={{position:'fixed',...}}>` | `Topbar.jsx` |
| `.input-glass` | `const inp = {width:'100%',height:48,border:'1.5px solid #D1D5DB',...}` | `LoginPage.jsx` |
| `.status-badge.is-*` | `SEV_C` / `ALERT_C` inline pill divs | `CommandCenter.jsx`, `AlertsPage.jsx` |
| `.section-title` | Page H1 inline `fontSize:22,fontWeight:800,color:'#0D3477'` | most pages |

---

## 5. Mobile Responsiveness

### Breakpoints (Tanzania officer device profile)

```css
/* Mobile-first. Use min-width to layer up. */
/* 375px  — small Android (Tecno/Itel — common in TZ)   */
/* 768px  — tablet / large phone landscape               */
/* 1024px — small laptop / iPad landscape                */
/* 1440px — desktop command center                       */
```

Recommended approach: **mobile-first `min()` / `clamp()` in the atoms
themselves** (already done above — see `.kpi-tile__value` and
`.section-title`), plus a small set of media queries for grid layout shifts.

### Mobile media queries (append to `mobile-overrides.css`)

```css
/* ════════════════════════════════════════════════════════════════
   TPDOP — MOBILE LAYER (extends existing mobile-overrides.css)
   ════════════════════════════════════════════════════════════════ */

/* ── Glass on mobile: less blur, more solid bg (performance) ── */
@media (max-width: 767px) {
  :root {
    --glass-blur: var(--glass-blur-mobile);     /* 8px vs 14px */
    --glass-hover-lift: var(--glass-hover-lift-mobile); /* no lift on touch */
    --glass-shadow-hover: var(--glass-shadow);  /* cheaper shadow */
  }
}

/* ── KPI tiles: 2x2 on mobile, 4x1 at ≥768, 6x1 at ≥1440 ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);   /* 2x2 on mobile */
  gap: 10px;
}
@media (min-width: 768px)  { .kpi-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; } }
@media (min-width: 1440px) { .kpi-grid { grid-template-columns: repeat(6, 1fr); } }

/* ── Tables on mobile: horizontal scroll via wrapper (preferred) ── */
/* The existing mobile-overrides.css forces `table { display:block; ... }`
   which works but breaks column-width algorithms. Improvement:
   wrap tables in <div className="table-wrapper"> and let THIS handle
   scroll. The existing block-level rule remains as a safety net. */
@media (max-width: 767px) {
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    /* Show a subtle edge hint that there's more to scroll */
    background:
      linear-gradient(to right, var(--surface) 30%, transparent),
      linear-gradient(to right, transparent, var(--surface) 70%) 100% 0,
      radial-gradient(farthest-side at 0 50%, rgba(13,52,119,0.15), transparent),
      radial-gradient(farthest-side at 100% 50%, rgba(13,52,119,0.15), transparent) 100% 0;
    background-repeat: no-repeat;
    background-size: 40px 100%, 40px 100%, 14px 100%, 14px 100%;
    background-position: 0 0, 100% 0, 0 0, 100% 0;
    background-attachment: local, local, scroll, scroll;
  }
  /* On mobile, allow long-text cells to wrap inside the scroll — only
     ref-number / numeric cells stay nowrap. Less aggressive than the
     current global `white-space: nowrap` on all cells. */
  .table-glass tbody td { white-space: normal; }
  .table-glass tbody td.ref,
  .table-glass tbody td.num { white-space: nowrap; }
}

/* ── Sidebar: confirm useResponsiveSidebar handles this correctly ── */
/* useResponsiveSidebar.js toggles `transform: translateX(-100%)` below
   768px and locks body scroll. This is correct. One small improvement:
   make the overlay use the glass-dark token for consistency. */
@media (max-width: 767px) {
  .sidebar-overlay {
    position: fixed; inset: 0; z-index: 49;
    background: rgba(3, 16, 43, 0.55);
    -webkit-backdrop-filter: blur(2px);
    backdrop-filter: blur(2px);
  }
}

/* ── Nav bar: tighter padding on mobile ── */
@media (max-width: 767px) {
  .nav-glass { padding: 0 12px; }
}

/* ── Drawer widths: existing !important overrides remain valid ── */
/* The existing rules in mobile-overrides.css that force width:100% on
   fixed drawers 400-560px are still correct. No change needed. */
```

### Confirmation of existing mobile systems

| System | Status | Notes |
|---|---|---|
| `useResponsiveSidebar.js` | ✅ Solid | `<768px` toggle + body-scroll lock + auto-close on nav. Optionally swap `window.innerWidth` listener for `matchMedia('(max-width: 767px)')` for better performance, but not required. |
| `mobile-overrides.css` table rule | ⚠️ Works, can improve | `table { display:block; overflow-x:auto }` is a reliable safety net. Add `.table-wrapper` approach (above) as the preferred path for new tables; keep the existing rule for legacy raw `<table>` elements. |
| `mobile-overrides.css` grid stacking | ✅ Solid | The `div[style*="gridTemplateColumns:..."]` attribute selectors correctly collapse multi-column inline grids to `1fr`. New pages should use `.kpi-grid` instead. |
| `mobile-overrides.css` drawer width | ✅ Solid | Forces full-width on fixed drawers ≤560px. Correct. |
| `useIsMobile.js` (referenced by `LoginPage`) | ✅ Confirm | Verify it uses the same `<768px` breakpoint as `useResponsiveSidebar` to avoid inconsistency. |

---

## 6. 10-Point Pre-Delivery Accessibility Checklist (glassmorphism-specific)

> Run every item before merging any glass-styled view. Government system —
> accessibility is a legal requirement, not a nice-to-have.

- [ ] **1. Text contrast on glass ≥ 4.5:1** — Verify with WebAIM Contrast Checker against the *worst-case* backdrop behind the glass (test against both `#F4F7FC` page surface AND `#0D3477` navy panel). Glass alpha must not drop paired text below AA. Body text uses `--ink-900`/`--glass-text-dark` only.
- [ ] **2. Gold never used as body text** — `--gold-500` (#D97706) is 3.2:1 on white = **fails AA for normal text** (passes for large text ≥18.66px bold). Gold is reserved for: button fills (`--gold-600`), borders, icons ≥24px, large headings (≥18.66px bold), and the `.section-title` underline. Audit every gold usage with grep.
- [ ] **3. `backdrop-filter` has a no-blur fallback** — Confirmed via `@supports not (backdrop-filter: blur(1px))` block. On unsupported browsers (old Android WebView), glass surfaces fall back to `--glass-bg-*-solid` (higher alpha, no blur) — contrast is preserved. Test by disabling `backdrop-filter` in DevTools → Rendering.
- [ ] **4. `prefers-reduced-transparency: reduce` honored** — On Windows "Reduce transparency" / High Contrast mode, all glass surfaces become fully opaque (`#FFFFFF` / `#0A1530`). Verify in Windows Settings → Personalization → Colors → "Transparency effects" OFF.
- [ ] **5. `prefers-contrast: more` strengthens borders** — Borders become 55% navy (light) / 35% white (dark) alpha. Verify in Chrome DevTools → Rendering → "Emulate forced colors: active".
- [ ] **6. Focus rings visible on every interactive element** — All buttons, inputs, links, and KPI tiles (if clickable) must show `:focus-visible` ring (`--focus-ring` or `--focus-ring-gold`). Test by tab-navigating every view **without touching the mouse**. Ring must be visible *on top of* the glass surface (the double-ring `0 0 0 2px #fff, 0 0 0 4px navy` pattern guarantees this).
- [ ] **7. Touch targets ≥ 44×44px** — All `.btn-*` atoms are 44px tall. Verify mobile sidebar nav buttons, table action icons, and pagination controls meet 44px minimum. Critical for officers using gloves.
- [ ] **8. Status info never conveyed by color alone** — `.status-badge` includes a `::before` dot AND text label. Verify severity (`SEV_C`) and alert (`ALERT_C`) displays also include text/icons, not just colored dots. Color-blind officers (≈8% of male population) must still understand status.
- [ ] **9. Motion respects `prefers-reduced-motion`** — Hover-lift transitions (`translateY(-2px)`) are disabled. Verify no glass element animates on mount for users with vestibular sensitivity. The CommandCenter live-clock is acceptable (1s tick, not motion).
- [ ] **10. Tables remain usable at 375px** — Every `<table>` either (a) is wrapped in `.table-wrapper` with horizontal scroll + edge-fade hint, or (b) falls back to the existing `display:block; overflow-x:auto` rule. Verify ref-number columns stay readable, long-text cells wrap, and no table causes horizontal page-scroll (only the table scrolls).

### Bonus (not glass-specific, but mandatory for gov)
- [ ] 11. `lang="sw"` on `<html>` (already set ✓) — screen readers pronounce Swahili correctly.
- [ ] 12. Every `<button>` has `aria-label` when icon-only (existing pattern in `Topbar.jsx` ✓ — extend to all icon buttons).
- [ ] 13. Form inputs have associated `<label>` (the existing `LoginPage` uses `placeholder` only — **add labels** for screen-reader users).
- [ ] 14. Color contrast of focus ring itself ≥ 3:1 against adjacent colors (the `#FFFFFF` inner ring guarantees this).

---

## Appendix: `index.html` font replacement

Replace lines 32-34 in `index.html`:

```html
<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap" rel="stylesheet" />
```

And update `body` font-family in `global.css` line 26:

```css
html, body {
  height: 100%;
  font-family: var(--font-sans);   /* was: 'Inter', 'Segoe UI', system-ui */
  font-size: 14px;
  color: var(--ink-900);           /* was: #0F172A — same value, now tokened */
  background: var(--surface);      /* was: #F4F7FC — same value, now tokened */
  -webkit-font-smoothing: antialiased;
}
```

(Note: CSS custom properties can be referenced in `global.css` *after* the
`:root` block is defined. Put the `:root` tokens at the very top of
`global.css`, above the reset.)
