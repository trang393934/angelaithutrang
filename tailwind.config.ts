import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        serif: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
        sans: ['Be Vietnam Pro', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-light": "hsl(var(--border-light))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        "background-pure": "hsl(var(--background-pure))",
        foreground: "hsl(var(--foreground))",
        "foreground-muted": "hsl(var(--foreground-muted))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          deep: "hsl(var(--primary-deep))",
          medium: "hsl(var(--primary-medium))",
          soft: "hsl(var(--primary-soft))",
          light: "hsl(var(--primary-light))",
          pale: "hsl(var(--primary-pale))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          gold: "hsl(var(--accent-gold))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'glow': 'var(--shadow-glow)',
        'divine': 'var(--shadow-divine)',
        'sacred': 'var(--shadow-button)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-slow": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px -5px hsla(214, 82%, 34%, 0.15)" },
          "50%": { boxShadow: "0 0 40px -5px hsla(214, 82%, 34%, 0.3)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "rank-up": {
          "0%": { transform: "translateY(10px)", opacity: "0.5", backgroundColor: "hsla(142, 76%, 36%, 0.2)" },
          "50%": { transform: "translateY(-5px)", backgroundColor: "hsla(142, 76%, 36%, 0.3)" },
          "100%": { transform: "translateY(0)", opacity: "1", backgroundColor: "transparent" },
        },
        "rank-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0.5", backgroundColor: "hsla(0, 84%, 60%, 0.2)" },
          "50%": { transform: "translateY(5px)", backgroundColor: "hsla(0, 84%, 60%, 0.3)" },
          "100%": { transform: "translateY(0)", opacity: "1", backgroundColor: "transparent" },
        },
        "rank-highlight": {
          "0%": { boxShadow: "0 0 0 0 hsla(43, 96%, 56%, 0.4)" },
          "50%": { boxShadow: "0 0 20px 5px hsla(43, 96%, 56%, 0.6)" },
          "100%": { boxShadow: "0 0 0 0 hsla(43, 96%, 56%, 0)" },
        },
        "coins-update": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)", color: "hsl(43, 96%, 56%)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.8s ease-out forwards",
        "fade-in-slow": "fade-in-slow 1.2s ease-out forwards",
        "scale-in": "scale-in 0.6s ease-out forwards",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "rank-up": "rank-up 0.8s ease-out forwards",
        "rank-down": "rank-down 0.8s ease-out forwards",
        "rank-highlight": "rank-highlight 1.5s ease-out forwards",
        "coins-update": "coins-update 0.6s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
