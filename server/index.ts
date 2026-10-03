import dotenv from "dotenv";
import * as path from "node:path";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: path.resolve(import.meta.dir, "..", envFile), override: false });

if (import.meta.main) {
    const { app } = await import("./src/app");
    Bun.serve({
        port: Number(process.env.PORT) || 8080,
        fetch: app.fetch,
    });
}
