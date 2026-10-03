import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import * as path from "node:path";

const env = loadEnv("development", path.resolve(__dirname, ".."));
const API_PATH = env.VITE_API_PATH || `http://localhost:${env.PORT ?? 8080}`;

export default defineConfig({
    envDir: path.resolve(__dirname, ".."),
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 5174,
        proxy: {
            "/api": {
                target: API_PATH,
                changeOrigin: true,
            },
            "/uploads": {
                target: API_PATH,
                changeOrigin: true,
            },
        },
    },
    build: {
        rollupOptions: {
        external: ['better-sqlite3'],
        },
    },
});
