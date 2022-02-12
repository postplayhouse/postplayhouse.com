const plugin = require("tailwindcss/plugin")
const defaultTheme = require("tailwindcss/defaultTheme")

const config = {
  mode: "jit",
  purge: ["./src/**/*.{html,js,svelte,ts,md}"],
  theme: {
    extend: {
      borderWidth: { 6: "6px" },
      fontFamily: {
        sans: ["metropolis", ...defaultTheme.fontFamily.sans],
        uber: ["azo-sans-uber", "Arial Black"],
      },
      screens: {
        xs: "460px",
      },
      minHeight: {
        64: "16rem",
        96: "24rem",
        128: "32rem",
      },
      minWidth: {
        xs: "4rem",
        sm: "8rem",
        md: "12rem",
        lg: "16rem",
        xl: "20rem",
      },

      colors: {
        grey: {
          100: "#f7fafc",
          200: "#edf2f7",
          300: "#e2e8f0",
          400: "#cbd5e0",
          500: "#a0aec0",
          600: "#718096",
          700: "#4a5568",
          800: "#2d3748",
          900: "#1a202c",
        },
        green: {
          100: "#e8f5e9",
          200: "#c8e6c9",
          300: "#a5d6a7",
          400: "#81c784",
          500: "#48bb78",
          600: "#38a169",
          700: "#2f855a",
          800: "#276749",
          900: "#22543d",
        },
      },
      spacing: { 128: "32rem" },
      inset: {
        1: "0.25rem",
        2: "0.5rem",
        3: "0.75rem",
        4: "1rem",
        5: "1.25rem",
      },
    },
  },
  plugins: [
    // @ts-expect-error shrug... this is callable
    plugin(function ({ addUtilities, theme, e }) {
      const spacing = theme("spacing")

      const indents = Object.entries(spacing).map(([name, distance]) => ({
        [`.${e(`text-indent-${name}`)}`]: {
          textIndent: distance,
        },
        [`.${e(`-text-indent-${name}`)}`]: {
          textIndent: `-${distance}`,
        },
      }))

      addUtilities(indents)
    }),
  ],
}

module.exports = config
