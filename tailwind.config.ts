import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Kinetic Precision palette ───────────────────────────────────────
      colors: {
        // Surfaces
        background: "#0b0e14",
        "surface-container-lowest":  "#0f1219",
        "surface-container-low":     "#131720",
        "surface-container":         "#161a21",
        "surface-container-high":    "#1c2029",
        "surface-container-highest": "#22262f",
        "surface-bright":            "#282c36",
        "surface-variant":           "#2e3340",

        // On-surface text
        "on-surface":         "#ecedf6",
        "on-surface-variant": "#8b909e",

        // Primary — purple
        primary:             "#de8eff",
        "primary-dim":       "#d779ff",
        "primary-container": "#4a1f6d",
        "on-primary":        "#1a0030",
        "on-primary-fixed":  "#0f001d",

        // Secondary — cyan
        secondary:             "#00eefc",
        "secondary-dim":       "#00ccd8",
        "secondary-container": "#003d42",
        "on-secondary":        "#001f22",

        // Tertiary — mint green
        tertiary:             "#c4ffcd",
        "tertiary-container": "#1b4d24",
        "on-tertiary":        "#003910",

        // Error — neon pink-red
        error:             "#ff6e84",
        "error-container": "#5c0017",

        // Outline
        outline:         "#6b7280",
        "outline-variant": "#45484f",

        // Shadcn compatibility aliases (keeps existing shadcn components working)
        foreground:  "#ecedf6",
        card:        { DEFAULT: "#161a21", foreground: "#ecedf6" },
        popover:     { DEFAULT: "#161a21", foreground: "#ecedf6" },
        muted:       { DEFAULT: "#22262f", foreground: "#8b909e" },
        accent:      { DEFAULT: "#22262f", foreground: "#ecedf6" },
        destructive: { DEFAULT: "#ff6e84", foreground: "#0f001d" },
        border: "#45484f",
        input:  "#22262f",
        ring:   "#de8eff",
      },

      // ─── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        headline: ["Space Grotesk", "sans-serif"],
        body:     ["Inter", "sans-serif"],
        mono:     ["JetBrains Mono", "monospace"],
      },

      // ─── Border radius ───────────────────────────────────────────────────
      borderRadius: {
        lg: "0.75rem",
        md: "0.375rem",
        sm: "0.25rem",
      },

      // ─── Neon glow box-shadows ────────────────────────────────────────────
      boxShadow: {
        "glow-primary":   "0 0 20px rgba(222,142,255,0.3)",
        "glow-secondary": "0 0 20px rgba(0,238,252,0.3)",
        "glow-tertiary":  "0 0 20px rgba(196,255,205,0.3)",
        "glow-error":     "0 0 20px rgba(255,110,132,0.3)",
      },

      // ─── Keyframe animations ─────────────────────────────────────────────
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition:  "200% center" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1"   },
        },
        "caret-blink": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
      },
      animation: {
        shimmer:      "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "caret-blink":"caret-blink 1s step-end infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
