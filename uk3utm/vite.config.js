import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// Catatan: fallback SPA (history API) sudah otomatis di dev server Vite,
// dan di produksi ditangani oleh vercel.json.
export default defineConfig({
  plugins: [react()],
});
