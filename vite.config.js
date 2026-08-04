import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const API = env.VITE_API_BASE_URL || "https://pretika-api-1.onrender.com";
  // `vite preview` serves the built dist/ (incl. the prerendered story pages).
  // Proxy its API/media paths to the live site so a production build can be
  // verified locally against real data (dev keeps using `server.proxy` above).
  const previewProxyTarget = process.env.PREVIEW_API_BASE || "https://pretika.in";
  const proxyPaths = ["/api", "/hubs", "/thumbnail", "/uploads", "/content-images", "/chat-images"];
  const mkProxy = (target) =>
    Object.fromEntries(
      proxyPaths.map((p) => [p, { target, changeOrigin: true, secure: true, ...(p === "/hubs" ? { ws: true } : {}) }])
    );
  return {
    plugins: [react()],
    preview: { proxy: mkProxy(previewProxyTarget) },
    server: {
      // Honor a PORT env var (used by the preview harness); fall back to 5173 in normal dev.
      port: process.env.PORT ? Number(process.env.PORT) : 5173,
      // The Render API has no CORS headers (it serves a native mobile app),
      // so in dev we proxy /api and media paths through Vite to stay same-origin.
      proxy: {
        "/api": { target: API, changeOrigin: true, secure: true },
        "/hubs": { target: API, changeOrigin: true, secure: true, ws: true },
        "/thumbnail": { target: API, changeOrigin: true, secure: true },
        "/uploads": { target: API, changeOrigin: true, secure: true },
        "/content-images": { target: API, changeOrigin: true, secure: true },
        "/chat-images": { target: API, changeOrigin: true, secure: true },
      },
    },
  };
});
