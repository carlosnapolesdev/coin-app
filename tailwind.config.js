/** @type {import('tailwindcss').Config} */

/**
 * Semantic color tokens are backed by CSS custom properties (see src/style.css).
 * Each variable holds raw RGB channels (e.g. "79 70 229") so Tailwind's
 * "<alpha-value>" placeholder keeps opacity modifiers working (bg-primary/10).
 * The same class therefore adapts automatically to light/dark themes.
 */
const token = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: token("--color-primary"),
          hover: token("--color-primary-hover"),
          fg: token("--color-primary-fg"),
        },
        // App background and elevated surfaces
        bg: token("--color-bg"),
        surface: {
          DEFAULT: token("--color-surface"),
          2: token("--color-surface-2"),
        },
        // Text
        content: token("--color-content"),
        muted: token("--color-muted"),
        faint: token("--color-faint"),
        // Lines / dividers (use as border-line, divide-line)
        line: {
          DEFAULT: token("--color-line"),
          strong: token("--color-line-strong"),
        },
        // Semantic status colors
        success: token("--color-success"),
        danger: token("--color-danger"),
        warning: token("--color-warning"),
        info: token("--color-info"),
        scrim: token("--color-scrim"),
        // Modal/lightbox overlay — theme-agnostic. Use as bg-overlay/X (X = alpha).
        overlay: token("--color-overlay"),
        // Text/icons that sit ON the overlay surface. Use as text-overlay-fg.
        "overlay-fg": token("--color-overlay-fg"),
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        elevated: "0 10px 30px -12px rgb(15 23 42 / 0.18)",
        focus: "0 0 0 3px rgb(var(--color-primary) / 0.25)",
      },
    },
  },
  plugins: [],
}
