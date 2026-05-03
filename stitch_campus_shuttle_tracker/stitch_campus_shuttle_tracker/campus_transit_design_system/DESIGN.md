---
name: Campus Transit Design System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45474d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545e76'
  primary: '#051125'
  on-primary: '#ffffff'
  primary-container: '#1b263b'
  on-primary-container: '#828da7'
  inverse-primary: '#bbc6e2'
  secondary: '#b7102a'
  on-secondary: '#ffffff'
  secondary-container: '#db313f'
  on-secondary-container: '#fffbff'
  tertiary: '#001228'
  on-tertiary: '#ffffff'
  tertiary-container: '#00274b'
  on-tertiary-container: '#4a90e2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#bbc6e2'
  on-primary-fixed: '#101b30'
  on-primary-fixed-variant: '#3c475d'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b1'
  on-secondary-fixed: '#410007'
  on-secondary-fixed-variant: '#92001c'
  tertiary-fixed: '#d4e3ff'
  tertiary-fixed-dim: '#a4c9ff'
  on-tertiary-fixed: '#001c39'
  on-tertiary-fixed-variant: '#004883'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Manrope
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style

This design system is engineered for utility, safety, and reliability within a fast-paced academic environment. The brand personality is authoritative yet helpful, mirroring the institutional trust of a university while providing the real-time responsiveness of a modern transit app. 

The visual style follows a **Corporate / Modern** direction. It utilizes high-density information displays, a structured hierarchical layout, and subtle depth through soft shadows to ensure that critical information—like bus locations and emergency SOS triggers—is instantly identifiable. The aesthetic balances deep, grounding navy tones with airy, functional whites to prevent cognitive overload during stressful commutes.

## Colors

The palette is anchored by **Deep Navy (#1B263B)**, used primarily for navigation sidebars, headers, and primary branding elements to evoke stability and professionalism. **Vibrant Red (#E63946)** is reserved exclusively for high-priority safety features and emergency actions, ensuring a high-contrast signal against the rest of the UI.

Content areas utilize a foundation of **Clean White (#FFFFFF)** and **Light Gray (#F8FAFC)** to maintain maximum readability and a spacious feel. A **Support Blue (#4A90E2)** is used for active states, live tracking indicators, and links, providing a clear but less urgent visual cue than the red safety elements.

## Typography

This design system employs a dual-font strategy to balance character with functionality. **Manrope** is used for headlines and titles, providing a modern, balanced, and geometric feel that looks professional at larger scales. 

**Inter** is the workhorse for all body text, UI labels, and data points. Its high x-height and neutral design ensure that bus stop names, ETAs, and safety instructions remain highly legible on mobile devices, even in low-light or outdoor conditions. Small labels and "Next Stop" indicators should use the bold uppercase treatment for immediate scannability.

## Layout & Spacing

The design system utilizes a **Fluid Grid** model with high density. Content is organized into modular cards that adapt to the viewport width while maintaining consistent internal padding. A 4px baseline grid ensures vertical rhythm across data-heavy lists.

For desktop or tablet views, a fixed-width sidebar (280px - 320px) houses the primary navigation and route progress, while the main content area expands to show the map or safety dashboard. Spacing between major UI components is generous (24px) to create clear separation, while internal component spacing is tighter (8px - 16px) to keep related data points grouped together.

## Elevation & Depth

Visual hierarchy is achieved through a combination of **Tonal Layers** and **Ambient Shadows**. The background layer is typically the neutral light gray, with primary content cards resting on top in pure white. 

Shadows are used sparingly and are extremely diffused (Blur: 15px, Opacity: 6%, Color: Deep Navy) to create a subtle lift without feeling heavy. Floating Action Buttons (FABs) like the SOS button on the map use a more pronounced shadow with a slight red tint to emphasize their "pressable" and urgent nature. Maps and sidebars should feel like they exist on the same plane, separated by subtle 1px borders or clear color blocks rather than deep shadows.

## Shapes

The design system uses a **Rounded** shape language to soften the institutional feel and make the app feel contemporary and accessible. 

Standard components like input fields and small cards use a 0.5rem (8px) radius. Larger containers, such as the Safety Panel modules or the active route card in the sidebar, utilize 1rem (16px) for a more distinct, friendly appearance. The SOS button and specific status indicators (like "Live" or "Departed") may use a full pill-shape (circular ends) to denote their status as interactive or high-priority badges.

## Components

### Buttons
- **Primary:** Deep Navy background with White text. Bold weight.
- **Emergency:** Vibrant Red background with White text. Includes a pulse animation for the SOS state.
- **Ghost:** Transparent background with a 1px Navy or Light Gray border.

### Cards
Cards are the primary container for information. They must have a white background, 16px border radius, and a subtle 1px border (#E2E8F0) or the ambient shadow defined in the Elevation section.

### Lists & Route Progress
Route lists use a vertical line (stepper style) to indicate progress. Current location is marked with a filled Navy circle, while upcoming stops use an outlined circle. Use "Label-Bold" typography for stop names that have been reached.

### Input Fields & Search
Search bars should have a soft gray background (#F1F5F9) with a 24px (pill-shaped) radius. Include a subtle search icon on the left to indicate functionality.

### Chips & Badges
Use chips for "Incident Types" or "Bus Status." These should have a light tinted background (e.g., Light Red background with Dark Red text for "Accident") to allow for quick color-coding without overwhelming the user.