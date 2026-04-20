/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        surface:        "#f8f9fc",
        card:           "#ffffff",
        panel:          "#f1f4f9",
        dim:            "#e8ecf4",
        accent:         "#2563eb",
        "accent-light": "#eff6ff",
        muted:          "#6b7280",
        border:         "#e2e8f0",
        ink:            "#0f172a",
        success:        "#16a34a",
        warn:           "#d97706",
        danger:         "#dc2626",
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      boxShadow: {
        card:        "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover":"0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        accent:      "0 4px 14px rgba(37,99,235,0.25)",
      },
    },
  },
  plugins: [],
};