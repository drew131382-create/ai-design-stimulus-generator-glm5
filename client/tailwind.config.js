/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        shell: "#eef2f8",
        ink: "#101828",
        near: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8"
        },
        medium: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c"
        },
        far: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce"
        }
      },
      boxShadow: {
        panel: "0 18px 45px -28px rgba(15, 23, 42, 0.28)",
        float: "0 18px 30px -24px rgba(15, 23, 42, 0.35)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(59,130,246,0.12), transparent 30%), radial-gradient(circle at top right, rgba(249,115,22,0.1), transparent 25%), radial-gradient(circle at bottom center, rgba(168,85,247,0.1), transparent 35%)"
      }
    }
  },
  plugins: []
};

