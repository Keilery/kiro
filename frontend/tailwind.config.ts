import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // iOS 26 inspired palette — darker iteration of Plan A.
        // Numeric stops mirror the CSS vars so utilities and tokens stay in sync.
        ink: {
          DEFAULT: "#000000",
          950: "#030305",
          900: "#06060A",
          800: "#0E0E12"
        },
        chrome: {
          50: "#FFFFFF",
          200: "rgba(255,255,255,0.85)",
          400: "rgba(255,255,255,0.45)",
          500: "#6E6E73",
          600: "rgba(255,255,255,0.22)",
          700: "rgba(255,255,255,0.09)",
          800: "rgba(255,255,255,0.05)",
          900: "rgba(255,255,255,0.035)"
        },
        signal: {
          success: "#30D158",
          warning: "#FF9F0A",
          error: "#FF453A"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      borderRadius: {
        ios: "22px",
        "ios-lg": "28px",
        "ios-sm": "14px"
      },
      backdropBlur: {
        liquid: "40px"
      },
      boxShadow: {
        "glass-edge":
          "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.04)",
        "glass-deep":
          "inset 0 1px 0 rgba(255,255,255,0.16), 0 30px 80px -20px rgba(0,0,0,0.8)"
      },
      transitionTimingFunction: {
        // ease-out exponential curves (per impeccable / motion principles)
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
        "out-quint": "cubic-bezier(0.22, 1, 0.36, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)"
      },
      keyframes: {
        "stripes-drift": {
          "0%": { backgroundPosition: "0px 0px" },
          "100%": { backgroundPosition: "120px 120px" }
        },
        "aurora-shift": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(2%, -1%, 0) scale(1.08)" }
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.9)" }
        }
      },
      animation: {
        "stripes-drift": "stripes-drift 18s linear infinite",
        "aurora-shift": "aurora-shift 14s ease-in-out infinite",
        "shimmer": "shimmer 2.4s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2.2s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
