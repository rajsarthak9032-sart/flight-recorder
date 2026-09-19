---
name: Lemonade Flight Recorder
colors:
  surface: '#091519'
  surface-dim: '#091519'
  surface-bright: '#303b40'
  surface-container-lowest: '#051014'
  surface-container-low: '#121d22'
  surface-container: '#162126'
  surface-container-high: '#202c31'
  surface-container-highest: '#2b363b'
  on-surface: '#d8e4eb'
  on-surface-variant: '#d4c4ae'
  inverse-surface: '#d8e4eb'
  inverse-on-surface: '#273237'
  outline: '#9d8f7a'
  outline-variant: '#504534'
  surface-tint: '#fcbb35'
  primary: '#ffc557'
  on-primary: '#422d00'
  primary-container: '#e6a820'
  on-primary-container: '#5c4000'
  inverse-primary: '#7c5800'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#c5d0d7'
  on-tertiary: '#273237'
  tertiary-container: '#a9b5bb'
  on-tertiary-container: '#3c474c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea8'
  primary-fixed-dim: '#fcbb35'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5e4200'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#d8e4eb'
  tertiary-fixed-dim: '#bcc8cf'
  on-tertiary-fixed: '#121d22'
  on-tertiary-fixed-variant: '#3d484e'
  background: '#091519'
  on-background: '#d8e4eb'
  surface-variant: '#2b363b'
typography:
  display-lg:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  metric-display:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.02em
  metric-value:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  timestamp:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.08em
  code-inline:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.5rem
  margin: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.375rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system draws direct inspiration from mission control telemetry panels, avionics glass cockpits, and high-precision scientific bench tools. It is engineered for ML systems engineers, local AI developers, and hardware performance architects working with local inference on AMD Ryzen AI NPUs and Radeon hardware.

The design movement is **Technical Minimalist / Scientific Instrumentation**. Visual decorations, fuzzy drop shadows, and ornamental gradients are rejected in favor of dense tabular arrays, 1px structural hairline grids, explicit mechanical indicators, and strict informational hierarchy. Every pixel must account for system state: memory saturation, token velocity, tensor compute distribution, and deterministic replay timestamps.

The interface evokes uncompromising precision, operational calm under high compute load, and total visibility into black-box neural execution.

## Colors

The palette is rooted in low-reflectance carbon substrates, engineered to sustain long analytical debugging sessions in dim control environments. Color is deployed as active information telemetry rather than visual branding.

### Foundation & Surfaces
- **Void Base (`#090B0C`)**: Main canvas backdrop, oscilloscope viewports, execution trace tracks.
- **Surface Layer 1 (`#0E1214`)**: Navigation docks, workspace splitters, structural panels.
- **Surface Layer 2 (`#141A1D`)**: Metric card wells, timeline scrubber rails, hover registries.
- **Surface Elevated (`#1A2226`)**: Active tooltips, popovers, contextual inspection drawers.

### Structural Hairlines
- **Divider Subdued (`#1E262A`)**: Standard 1px module borders, tabular row delimiters.
- **Divider Focused (`#283338`)**: Active pane splitters, inspector container perimeters.

### Typography Hierarchy
- **Text Primary (`#F0F4F6`)**: High-contrast readouts, active state indicators, primary metrics.
- **Text Secondary (`#8D999F`)**: Data headers, contextual units (tok/s, GB, ms), parameter labels.
- **Text Muted (`#556268`)**: Inactive metrics, baseline timestamps, dormant process nodes.

### Telemetry & Instrumentation Status
- **Telemetry Accent (`#E6A820` / `#F3BA35`)**: Reserved strictly for replay heads, active pins, scrub line indicators, and primary execution controls. Glow field is capped at `rgba(230, 168, 32, 0.15)`.
- **Avionics Nominal (`#10B981`)**: Normal runtime operational parameters, NPU thermal envelope safe, model weights verified.
- **Avionics Warning (`#F59E0B`)**: Memory pressure >85%, token generation throttling, cache eviction warnings.
- **Avionics Critical (`#EF4444`)**: Out of VRAM faults, assertion aborts, layer execution desynchronization.
- **Bus Routing (`#38BDF8`)**: Memory bus traffic, tensor memory transfer across PCIe/Infinity Fabric.

## Typography

Typography functions as visual instrumentation. Dual-family discipline is enforced across the board:

1. **System Structural (`Geist`)**: Used for workspace navigation, panel captions, structural breadcrumbs, and natural language log explanations. Features high x-height, neutral tone, and optimal clarity at 11px–14px.
2. **Telemetry Tabular (`JetBrains Mono`)**: Applied to all metric payloads, execution timecodes (e.g., `T+00:14.492`), model throughput counters, register addresses, token counts, and memory byte allocations.

### Tabular Alignment Rules
- `font-feature-settings: "tnum" on, "zero" on` is globally applied to all monospace metrics. Numbers must remain stable and visually fixed during active streaming telemetry loops without causing horizontal layout shifts.
- `label-caps` is always set in uppercase with `letter-spacing: 0.08em` for field descriptor labels (e.g., `NPU OCCUPANCY`, `VRAM RESIDENT`, `TTFT`).

## Layout & Spacing

The layout model implements an adjustable multi-pane instrumentation dock:
- **Desktop (Primary Workstation Target)**: Full-viewport, zero-scroll container layout. Panes conform to a 3-column orchestrator (Left: Trace Explorer / Model Tree; Center: Multi-lane Telemetry Scrubber & Graph Inspector; Right: Node Execution & Memory Inspector) separated by 1px draggable splitters with 0.5rem inner gutters.
- **Tablet / Secondary Display**: Collapses the left tree into an icon rail. Center timeline retains continuous streaming density.
- **Mobile**: Restricted to triage run summaries, quick health statuses, and incident logs. Complex multi-track replay lanes switch to summary telemetry lists.

Spacing follows an ultra-compact 4px modular rhythm (`0.25rem`, `0.375rem`, `0.75rem`, `1rem`) maximizing viewport information density without element collision. All paddings prioritize rapid tabular scanning.

## Elevation & Depth

Visual hierarchy does not rely on blurred shadows or dramatic z-axis separation. Depth is conveyed strictly through **tonal layering**, **hairline structural borders**, and **contained luminescent telemetry indicators**.

### Depth Layers
1. **Base Layer (0dp)**: Substrate (`#090B0C`). Timeline background grids, stream viewports.
2. **Panel Layer (1dp)**: Primary card frames and persistent sidebars (`#0E1214`) enclosed by hairline borders (`#1E262A`).
3. **Interactive Well Layer (2dp)**: Log rows, input slots, and metric tracks recessed into panels using `#141A1D`.
4. **Floating HUD Layer (3dp)**: Pinned tooltip markers, scrub timecodes, context menus using `#1A2226` bordered with `#283338`.

### Luminescence Constraints
Box-shadows are entirely absent except for active state indicators:
- **Active Scrubber Head**: `box-shadow: 0 0 8px rgba(230, 168, 32, 0.2)`
- **Fault Critical Pin**: `box-shadow: 0 0 8px rgba(239, 68, 68, 0.25)`
- **Nominal Heartbeat**: `box-shadow: 0 0 6px rgba(16, 185, 129, 0.2)`

## Shapes

The design system uses a strict **Soft (Level 1)** geometric specification. Curvature is kept low to mirror milled chassis hardware and technical avionics displays:
- Standard UI modules, status badges, buttons, and inputs: `4px` (`0.25rem`).
- Large diagnostic containers, dock viewports, and modal frames: `6px` (`0.375rem`).
- Scrubber track handles, status pips, and indicator LEDs: `2px` or sharp 90° cuts. Circular treatments (`9999px`) are allowed only for small runtime heartbeat dots (`6px` x `6px`).

## Components

### Buttons & Transport Controls
- **Primary / Replay Trigger**: Background `#E6A820`, text `#090B0C` (JetBrains Mono, 600 weight), border none, radius `4px`. Hover transitions to `#F3BA35`. Focus shows a 1px offset ring `#E6A820`.
- **Secondary / Subsystem Toggle**: Background `#141A1D`, text `#F0F4F6`, border 1px solid `#283338`. Hover transitions background to `#1E262A`.
- **Ghost Action / Step Control**: Background transparent, text `#8D999F`, hover text `#F0F4F6`, hover background `#141A1D`. Height: 24px or 28px for dense layout integration.

### Telemetry Metric Cards & Panels
- Background `#0E1214`, 1px perimeter border `#1E262A`, border-radius `4px`, padding `space-md`.
- Top header: `label-caps` in `#8D999F` with small status LED (3px x 3px) or unit tag aligned right.
- Value block: `metric-display` in `#F0F4F6`, tabular-aligned.
- Delta footer: Mini sparkline or baseline difference formatted as `+12.4% vs baseline` using `#10B981` or `#F59E0B`.

### Timecode & Scrubber Track
- Full-width composite horizontal element on `#090B0C`. 
- Minor ticks at 100ms intervals `#1E262A`, major ticks at 1s intervals with `timestamp` values in `#556268`.
- Scrubber line: 1px hairline in `#E6A820` with a top 8px diamond indicator and micro badge showing `T+XX:XX.XXX`.
- Trace lanes: Stacked compact horizontal channels (20px height per channel: NPU Core, VRAM Allocator, Engine Queue).

### Data Tables & Log Registries
- Dense tabular rows with height capped at `28px`.
- Alternating zero-fill background or subtle hover highlight `#141A1D`.
- Cell borders: 1px bottom divider `#1E262A`.
- Log severity represented via 2px left border strip: Emerald for Nominal, Amber for Warning, Crimson for Core Panic.

### Input Fields & Query Filters
- Background `#090B0C`, border 1px solid `#1E262A`, text `#F0F4F6`, font `JetBrains Mono` 12px.
- Focus state: Border transitions to `#E6A820` with zero outline offset.
- Integrated quick-key hint right-aligned (e.g. `[Ctrl+K]`) in `#556268`.

### Status Badges & Hardware Indicators
- Compact chip (18px height), background `#141A1D`, border 1px solid `#1E262A`, border-radius `3px`, padding `2px 6px`.
- Monospace 10px uppercase type with an inline 4px colored circle indicating device target (e.g. `● RDNA3 GPU`, `● XDNA2 NPU`).