import { unlink } from "node:fs/promises";
import { join } from "node:path";
import type { BlobStore } from "../../store";

export const UPLOADS_DIR = join(import.meta.dir, "../../../../uploads");

export function sqliteBlobStore(): BlobStore {
    return {
        async put(data, relPath) {
            await Bun.write(join(UPLOADS_DIR, relPath), data);
            return `/uploads/${relPath}`;
        },
        async read(urlOrPath) {
            const rel = urlOrPath.replace(/^\/uploads\//, "");
            if (rel === urlOrPath || rel.includes("/") || rel.includes("\\") || rel.includes("..")) return null;
            const file = Bun.file(join(UPLOADS_DIR, rel));
            if (!(await file.exists())) return null;
            return await file.text();
        },
        async delete(urlOrPath) {
            const rel = urlOrPath.replace(/^\/uploads\//, "");
            if (rel === urlOrPath || rel.includes("/") || rel.includes("\\") || rel.includes("..")) return;
            await unlink(join(UPLOADS_DIR, rel)).catch(() => {});
        },
    };
}
