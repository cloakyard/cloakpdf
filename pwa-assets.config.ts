import { defineConfig } from "@vite-pwa/assets-generator/config";

const fullBleed = {
  padding: 0,
  resizeOptions: {
    fit: "cover" as const,
    background: "#2563EB",
  },
};

export default defineConfig({
  images: ["public/icons/cloakpdf-app-icon.svg"],
  preset: {
    transparent: {
      ...fullBleed,
      sizes: [64, 192, 512],
      favicons: [[48, "favicon.ico"]],
    },
    maskable: {
      ...fullBleed,
      sizes: [512],
    },
    apple: {
      ...fullBleed,
      sizes: [180],
    },
  },
});
