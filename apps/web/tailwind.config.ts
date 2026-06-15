import type { Config } from "tailwindcss";
import preset from "@stayboost/config/tailwind";

const config: Config = {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    // Scan the design system so its utility classes are generated.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
