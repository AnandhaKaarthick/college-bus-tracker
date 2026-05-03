# DESIGN_SYSTEM.md
## Campus Transit Design System — Stitch
### Typography · Colors · Spacing · Components

> **This is the single source of truth for every visual decision in the redesigned app.** All components must use the tokens defined here — no hardcoded hex values anywhere in component files.

---

## 1. Brand Identity

| Property | Value |
|----------|-------|
| **System Name** | Campus Transit — Stitch |
| **Visual Personality** | Institutional Authority + Student Warmth |
| **Core Emotion** | "I trust this app. It knows where my bus is." |
| **Anti-Patterns** | Generic blue SaaS / clinical white / startup minimal |

---

## 2. Typography

### 2.1 Font Families

| Role | Font | Weights Used | Google Fonts Import |
|------|------|-------------|-------------------|
| **Headlines** | Manrope | 700, 800 | `Manrope:wght@700;800` |
| **Body / Labels** | Inter | 400, 500, 600 | `Inter:wght@400;500;600` |

**Google Fonts link tag (add to `index.html`):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@700;800&display=swap" rel="stylesheet">
```

### 2.2 Type Scale

| Token | Font | Size | Weight | Line Height | Usage |
|-------|------|------|--------|-------------|-------|
| `--type-hero` | Manrope | 48px / 3rem | 800 | 1.1 | ETA countdown (My Bus Card) |
| `--type-h1` | Manrope | 28px / 1.75rem | 700 | 1.2 | Page titles |
| `--type-h2` | Manrope | 22px / 1.375rem | 700 | 1.3 | Section headers, card titles |
| `--type-h3` | Manrope | 18px / 1.125rem | 700 | 1.4 | Sub-section, modal headers |
| `--type-label-lg` | Inter | 16px / 1rem | 600 | 1.5 | Primary labels, button text |
| `--type-label-md` | Inter | 14px / 0.875rem | 500 | 1.5 | Secondary labels, nav tabs |
| `--type-label-sm` | Inter | 12px / 0.75rem | 500 | 1.4 | Badges, chips, timestamps |
| `--type-body` | Inter | 14px / 0.875rem | 400 | 1.6 | Body copy, descriptions |
| `--type-caption` | Inter | 11px / 0.6875rem | 400 | 1.4 | Fine print, map attributions |

**CSS:**
```css
:root {
  --font-headline: 'Manrope', sans-serif;
  --font-body:     'Inter', sans-serif;
}

/* Apply globally */
body {
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.6;
}

h1, h2, h3, .headline {
  font-family: var(--font-headline);
}
```

---

## 3. Color System

### 3.1 Light Mode ☀️

```css
:root {
  /* ── Brand ── */
  --brand-navy:          #1B263B;   /* Deep Navy — primary dark surface */
  --brand-red:           #E63946;   /* Vibrant Red — primary CTA, active states */
  --brand-red-light:     #FDECEA;   /* Red tint — badge backgrounds, alerts */
  --brand-red-hover:     #CC2F3C;   /* Hover state for red buttons */

  /* ── Base Surfaces ── */
  --bg-primary:          #F4F6FA;   /* App background — warm off-white */
  --bg-secondary:        #FFFFFF;   /* Cards, bottom sheet, modals */
  --bg-tertiary:         #EEF1F7;   /* Input fields, inactive tabs */
  --bg-navy-card:        #1B263B;   /* Dark navy card (My Bus Card dark section) */
  --surface-overlay:     rgba(255, 255, 255, 0.78);  /* Glassmorphism bars */
  --border:              #DDE3EE;   /* Card borders, dividers */
  --shadow-sm:           rgba(27, 38, 59, 0.06);
  --shadow-md:           rgba(27, 38, 59, 0.12);
  --shadow-lg:           rgba(27, 38, 59, 0.20);

  /* ── Text ── */
  --text-primary:        #1B263B;   /* Headings — same as brand navy */
  --text-secondary:      #4A5568;   /* Body, descriptions */
  --text-muted:          #8E9BBC;   /* Timestamps, placeholders, captions */
  --text-inverse:        #FFFFFF;   /* Text on dark/red surfaces */
  --text-on-red:         #FFFFFF;   /* Text on brand-red */

  /* ── Accent / Interactive ── */
  --accent-primary:      #E63946;   /* Primary CTA, active nav dot, ETA badge */
  --accent-primary-bg:   #FDECEA;   /* Light red backgrounds */
  --accent-hover:        #CC2F3C;
  --accent-secondary:    #1B263B;   /* Navy — secondary buttons, headers */

  /* ── Status ── */
  --success:             #16A34A;
  --success-bg:          #DCFCE7;
  --warning:             #D97706;
  --warning-bg:          #FEF3C7;
  --danger:              #DC2626;
  --danger-bg:           #FEE2E2;
  --info:                #2563EB;
  --info-bg:             #DBEAFE;

  /* ── Map ── */
  --route-line:          rgba(230, 57, 70, 0.65);   /* Red route polyline */
  --route-line-passed:   rgba(142, 155, 188, 0.40);
  --stop-pin-active:     #E63946;
  --stop-pin-default:    #8E9BBC;
  --stop-pin-done:       #DDE3EE;
  --bus-ring:            #FFFFFF;
  --user-dot:            #E63946;
  --user-dot-ring:       rgba(230, 57, 70, 0.22);

  /* ── Navigation ── */
  --nav-bg:              #FFFFFF;
  --nav-border:          #DDE3EE;
  --nav-active:          #E63946;
  --nav-inactive:        #8E9BBC;
}
```

### 3.2 Dark Mode 🌙

```css
[data-theme="dark"] {
  /* ── Brand ── */
  --brand-navy:          #1B263B;
  --brand-red:           #FF6B74;   /* Lighter red — better contrast on dark */
  --brand-red-light:     #2D1215;
  --brand-red-hover:     #FF8A91;

  /* ── Base Surfaces ── */
  --bg-primary:          #0E1623;   /* Deeper than navy — true dark background */
  --bg-secondary:        #1B263B;   /* Deep Navy — card surface */
  --bg-tertiary:         #243347;   /* Slightly lighter — inputs, inactive */
  --bg-navy-card:        #243347;
  --surface-overlay:     rgba(14, 22, 35, 0.82);
  --border:              #2A3F5C;
  --shadow-sm:           rgba(0, 0, 0, 0.20);
  --shadow-md:           rgba(0, 0, 0, 0.35);
  --shadow-lg:           rgba(0, 0, 0, 0.50);

  /* ── Text ── */
  --text-primary:        #E8EDF5;
  --text-secondary:      #8E9BBC;
  --text-muted:          #4A5E7A;
  --text-inverse:        #0E1623;
  --text-on-red:         #FFFFFF;

  /* ── Accent / Interactive ── */
  --accent-primary:      #FF6B74;
  --accent-primary-bg:   #2D1215;
  --accent-hover:        #FF8A91;
  --accent-secondary:    #8E9BBC;

  /* ── Status ── */
  --success:             #4ADE80;
  --success-bg:          #052E16;
  --warning:             #FCD34D;
  --warning-bg:          #1C1200;
  --danger:              #F87171;
  --danger-bg:           #2D0000;
  --info:                #60A5FA;
  --info-bg:             #1E3A5F;

  /* ── Map ── */
  --route-line:          rgba(255, 107, 116, 0.70);
  --route-line-passed:   rgba(42, 63, 92, 0.60);
  --stop-pin-active:     #FF6B74;
  --stop-pin-default:    #4A5E7A;
  --stop-pin-done:       #2A3F5C;
  --bus-ring:            #1B263B;
  --user-dot:            #FF6B74;
  --user-dot-ring:       rgba(255, 107, 116, 0.20);

  /* ── Navigation ── */
  --nav-bg:              #1B263B;
  --nav-border:          #2A3F5C;
  --nav-active:          #FF6B74;
  --nav-inactive:        #4A5E7A;
}
```

### 3.3 Color Palette Quick Reference

```
                    ☀️ LIGHT            🌙 DARK
                    ──────────────      ──────────────────
Brand Navy:         #1B263B             #1B263B (same)
Brand Red:          #E63946             #FF6B74 (lighter)
App Background:     #F4F6FA             #0E1623
Card Surface:       #FFFFFF             #1B263B
Input / Tab:        #EEF1F7             #243347
Border:             #DDE3EE             #2A3F5C

Text Primary:       #1B263B             #E8EDF5
Text Secondary:     #4A5568             #8E9BBC
Text Muted:         #8E9BBC             #4A5E7A

CTA / Active:       #E63946             #FF6B74
Success:            #16A34A / #DCFCE7   #4ADE80 / #052E16
Warning:            #D97706 / #FEF3C7   #FCD34D / #1C1200
Danger:             #DC2626 / #FEE2E2   #F87171 / #2D0000
```

---

## 4. Spacing System

All spacing is based on a **4px base unit.**

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Icon padding, tight gaps |
| `--space-2` | 8px | Inner padding (compact) |
| `--space-3` | 12px | Badge padding, list item gap |
| `--space-4` | 16px | Standard inner padding |
| `--space-5` | 20px | Card padding |
| `--space-6` | 24px | Section gaps |
| `--space-8` | 32px | Large section breaks |
| `--space-12` | 48px | Page-level vertical rhythm |

---

## 5. Border Radius

> **Rule:** All interactive surfaces use `1rem` (16px). This is the "Soft Institutional" standard — warm and approachable but not bubbly.

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Badges, chips, small pills |
| `--radius-md` | 12px | Input fields, compact cards |
| `--radius-lg` | 16px | Cards, modals, bottom sheet, buttons |
| `--radius-xl` | 20px | My Bus Card hero section |
| `--radius-full` | 9999px | Circular buttons, avatar, nav active dot |

```css
:root {
  --radius-sm:   0.5rem;    /* 8px  */
  --radius-md:   0.75rem;   /* 12px */
  --radius-lg:   1rem;      /* 16px — primary "Soft Institutional" */
  --radius-xl:   1.25rem;   /* 20px */
  --radius-full: 9999px;
}
```

---

## 6. Shadow System

```css
:root {
  --shadow-card: 0 2px 8px var(--shadow-sm), 0 0 1px var(--border);
  --shadow-sheet: 0 -4px 24px var(--shadow-md);
  --shadow-modal: 0 8px 40px var(--shadow-lg);
  --shadow-nav: 0 -1px 0 var(--nav-border);
}
```

---

## 7. Component Token Reference

### 7.1 Cards (all pages)

```css
.card {
  background:    var(--bg-secondary);
  border:        1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow:    var(--shadow-card);
  padding:       var(--space-5);
}
```

### 7.2 Primary Button (CTA)

```css
.btn-primary {
  background:    var(--accent-primary);
  color:         var(--text-on-red);
  border-radius: var(--radius-lg);
  font-family:   var(--font-body);
  font-size:     14px;
  font-weight:   600;
  padding:       12px 20px;
  border:        none;
  cursor:        pointer;
  transition:    background 200ms ease, transform 100ms ease;
}
.btn-primary:hover  { background: var(--accent-hover); }
.btn-primary:active { transform: scale(0.97); }
```

### 7.3 Secondary Button

```css
.btn-secondary {
  background:    transparent;
  color:         var(--text-primary);
  border:        1.5px solid var(--border);
  border-radius: var(--radius-lg);
  font-weight:   600;
  font-size:     14px;
  padding:       11px 20px;
  cursor:        pointer;
  transition:    background 200ms ease;
}
.btn-secondary:hover { background: var(--bg-tertiary); }
```

### 7.4 Status Pill / Badge

```css
.pill {
  display:         inline-flex;
  align-items:     center;
  gap:             4px;
  border-radius:   var(--radius-sm);
  padding:         3px 8px;
  font-family:     var(--font-body);
  font-size:       11px;
  font-weight:     600;
  letter-spacing:  0.03em;
  text-transform:  uppercase;
}

.pill-success  { background: var(--success-bg);  color: var(--success); }
.pill-warning  { background: var(--warning-bg);  color: var(--warning); }
.pill-danger   { background: var(--danger-bg);   color: var(--danger);  }
.pill-info     { background: var(--info-bg);     color: var(--info);    }
.pill-red      { background: var(--brand-red-light); color: var(--accent-primary); }
```

### 7.5 Feature Badge (WiFi / Density)

```css
.feature-badge {
  display:       inline-flex;
  align-items:   center;
  gap:           3px;
  background:    var(--bg-tertiary);
  border:        1px solid var(--border);
  border-radius: var(--radius-sm);
  padding:       2px 7px;
  font-size:     11px;
  font-weight:   500;
  color:         var(--text-secondary);
}
```

### 7.6 Input Field

```css
.input {
  background:    var(--bg-tertiary);
  border:        1.5px solid var(--border);
  border-radius: var(--radius-md);
  padding:       12px 16px;
  font-family:   var(--font-body);
  font-size:     14px;
  color:         var(--text-primary);
  outline:       none;
  width:         100%;
  transition:    border-color 200ms ease;
}
.input:focus {
  border-color: var(--accent-primary);
}
.input::placeholder {
  color: var(--text-muted);
}
```

### 7.7 Bottom Sheet

```css
.bottom-sheet {
  background:       var(--bg-secondary);
  border-radius:    var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow:       var(--shadow-sheet);
  padding:          var(--space-5);
}

.bottom-sheet__handle {
  width:         40px;
  height:        4px;
  background:    var(--border);
  border-radius: var(--radius-full);
  margin:        0 auto var(--space-4);
}
```

---

## 8. Icon System

Use **Lucide React** throughout. Size standards:

| Context | Size | Stroke Width |
|---------|------|-------------|
| Navigation bar | 22px | 2px |
| Card icons | 18px | 2px |
| Inline / badge icons | 14px | 2px |
| Hero / SOS button | 28px | 2.5px |

---

## 9. Motion & Animation

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Page transition | 280ms | `ease-in-out` | Tab switches |
| Bottom sheet slide | Spring (stiffness 300, damping 30) | Framer Motion | Sheet open/close |
| Modal fade + slide | 250ms | `ease-out` | Stop detail modal |
| SOS hold progress | 3000ms | `linear` | SOS ring fill |
| ETA number tick | 400ms | `ease-in-out` | Number transitions |
| Nav active dot | 200ms | `ease-in-out` | Tab switch indicator |
| Theme toggle icon | 300ms | `ease-in-out` | ☀️/🌙 icon rotate |

---

## 10. Map Style Tokens

| Theme | Tile Source | Style |
|-------|------------|-------|
| Light | OpenStreetMap standard | Default |
| Dark | Maptiler "Dataviz Dark" | Custom dark |

**Route polyline:** `var(--route-line)` — red in both modes  
**User dot:** `var(--user-dot)` — red pulse  
**Bus marker:** Custom SVG — uses `var(--accent-primary)` fill, `var(--bus-ring)` border
