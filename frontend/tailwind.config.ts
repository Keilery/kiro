import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // === KOCMOC космическая палитра ===
        space: {
          black: "#0A0A0A",
          deep: "#111111",
          nebula: "#1A1A1A",
          gray: "#2A2A2A",
          dust: "#888888",
          lunar: "#E5E5E5",
          white: "#FFFFFF"
        },
        nova: {
          green: "#00FF88",
          red: "#FF3333",
          blue: "#4488FF",
          amber: "#FFAA00"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      borderRadius: {
        orbit: "20px",
        "orbit-lg": "32px",
        "orbit-sm": "12px"
      },
      backdropBlur: {
        nebula: "32px"
      },
      boxShadow: {
        "orbit-edge":
          "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(255,255,255,0.04)",
        "orbit-deep":
          "inset 0 1px 0 rgba(255,255,255,0.14), 0 28px 80px -16px rgba(0,0,0,0.9)",
        "halo-white":
          "0 0 0 1px rgba(255,255,255,0.15), 0 0 32px rgba(255,255,255,0.10)",
        "halo-strong":
          "0 0 0 1px rgba(255,255,255,0.30), 0 0 64px rgba(255,255,255,0.18)"
      },
      transitionTimingFunction: {
        gravity: "cubic-bezier(0.16, 1, 0.3, 1)",
        warp: "cubic-bezier(0.22, 1, 0.36, 1)",
        orbit: "cubic-bezier(0.25, 1, 0.5, 1)"
      },
      keyframes: {
        "twinkle": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" }
        },
        "orbit-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        "orbit-spin-reverse": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-360deg)" }
        },
        "drift": {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-6px,0)" }
        },
        "halo-breathe": {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.65", transform: "scale(1.06)" }
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.9)" }
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" }
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "twinkle": "twinkle 3s ease-in-out infinite",
        "orbit-slow": "orbit-spin 120s linear infinite",
        "orbit-med": "orbit-spin 60s linear infinite",
        "orbit-fast": "orbit-spin 30s linear infinite",
        "orbit-reverse": "orbit-spin-reverse 90s linear infinite",
        "drift": "drift 6s ease-in-out infinite",
        "halo-breathe": "halo-breathe 6s ease-in-out infinite",
        "shimmer": "shimmer 2.4s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "scan-line": "scan-line 8s linear infinite",
        "fade-up": "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both"
      }
    }
  },
  plugins: []
};

export default config;
