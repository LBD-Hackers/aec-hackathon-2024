import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'esbuild',
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
      minifyIdentifiers: true,
      keepNames: false
    },
  },
});
