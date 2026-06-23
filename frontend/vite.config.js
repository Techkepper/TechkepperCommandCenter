import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devBackend = env.VITE_DEV_BACKEND_URL || "http://localhost:8081";

  return {
    plugins: [
      react({
        jsxRuntime: "classic",
      }),
    ],
    server: {
      port: 3000,
      open: true,
      proxy: {
        "/api": {
          target: devBackend,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    build: {
      outDir: "build",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            "material-ui": [
              "@material-ui/core",
              "@material-ui/icons",
              "@material-ui/lab",
            ],
          },
        },
      },
    },
    envPrefix: "VITE_",
    esbuild: {
      loader: "jsx",
      include: /src\/.*\.[jt]sx?$/,
      exclude: [],
    },
    define: {
      global: "globalThis",
    },
    optimizeDeps: {
      include: [
        "mic-recorder-to-mp3",
        "@material-ui/core",
        "@material-ui/icons",
        "@material-ui/lab",
      ],
      exclude: [],
    },
    resolve: {
      alias: {
        "jss-plugin-globalThis": "jss-plugin-global",
      },
    },
  };
});
