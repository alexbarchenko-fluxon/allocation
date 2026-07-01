/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        "electric-blue": {
          25:  "var(--electric-blue-25)",
          50:  "var(--electric-blue-50)",
          100: "var(--electric-blue-100)",
          600: "var(--electric-blue-600)",
          700: "var(--electric-blue-700)",
        },
        /* Extended hover — functional token (Figma: 3. Mode / extended/extended-hover) */
        "extended-hover": "var(--extended-hover)",
        "badge-success": {
          DEFAULT: "var(--badge-success-bg)",
          stroke: "var(--badge-success-stroke)",
          fg: "var(--badge-success-fg)",
        },
        "badge-warning": {
          DEFAULT: "var(--badge-warning-bg)",
          stroke: "var(--badge-warning-stroke)",
          fg: "var(--badge-warning-fg)",
        },
        "badge-error": {
          DEFAULT: "var(--badge-error-bg)",
          stroke: "var(--badge-error-stroke)",
          fg: "var(--badge-error-fg)",
        },
        "badge-neutral": {
          DEFAULT: "var(--badge-neutral-bg)",
          stroke: "var(--badge-neutral-stroke)",
          fg: "var(--badge-neutral-fg)",
        },
        "badge-blue": {
          DEFAULT: "var(--badge-blue-bg)",
          stroke: "var(--badge-blue-stroke)",
          fg: "var(--badge-blue-fg)",
        },
        /* Allocation timeline block tokens (Figma: 4. Custom / allocation-timeline) */
        "timeline-assigned": {
          DEFAULT: "var(--timeline-assigned-bg)",
          stroke: "var(--timeline-assigned-stroke)",
          fg: "var(--timeline-assigned-fg)",
        },
        "timeline-misalloc": {
          DEFAULT: "var(--timeline-misalloc-bg)",
          stroke: "var(--timeline-misalloc-stroke)",
          fg: "var(--timeline-misalloc-fg)",
        },
        "timeline-unassigned": {
          DEFAULT: "var(--timeline-unassigned-bg)",
          stroke: "var(--timeline-unassigned-stroke)",
          fg: "var(--timeline-unassigned-fg)",
        },
        "timeline-ooo-stripe": "var(--timeline-ooo-stripe)",
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
        xs: "var(--radius-xs)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        "4xl": "var(--radius-4xl)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
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
        "step-exit-left": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(-100%)", opacity: "0" },
        },
        "step-exit-right": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(100%)", opacity: "0" },
        },
        "step-enter-from-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "step-enter-from-left": {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "step-exit-left": "step-exit-left 0.32s ease-in-out forwards",
        "step-exit-right": "step-exit-right 0.32s ease-in-out forwards",
        "step-enter-from-right": "step-enter-from-right 0.32s ease-in-out forwards",
        "step-enter-from-left": "step-enter-from-left 0.32s ease-in-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}