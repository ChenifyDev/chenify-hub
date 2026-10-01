import type { PluginFile, PluginInstallSource, PluginManifest, StoredPlugin } from "./types.ts";

const DB_NAME = "chenify-plugins";
const DB_VERSION = 1;
const STORE = "plugins";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
            reject(new Error("当前浏览器不支持 IndexedDB，无法保存插件"));
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE)) {
                const store = db.createObjectStore(STORE, { keyPath: "id" });
                store.createIndex("order", "order", { unique: false });
            }
        };
        request.onsuccess = () => {
            const db = request.result;
            db.onversionchange = () => db.close();
            resolve(db);
        };
        request.onerror = () => reject(request.error ?? new Error("打开插件数据库失败"));
        request.onblocked = () => reject(new Error("插件数据库被其他标签页占用，请关闭其他标签页后重试"));
    });
    dbPromise.catch(() => {
        dbPromise = null;
    });
    return dbPromise;
}

function request<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("IndexedDB 请求失败"));
    });
}

function done(tx: IDBTransaction): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB 事务失败"));
        tx.onabort = () => reject(tx.error ?? new Error("IndexedDB 事务被中止"));
    });
}

export async function listPlugins(): Promise<StoredPlugin[]> {
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const all = await request<StoredPlugin[]>(tx.objectStore(STORE).getAll());
    await done(tx);
    return all.sort((a, b) => a.order - b.order);
}

export async function getPlugin(id: string): Promise<StoredPlugin | null> {
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const record = await request<StoredPlugin | undefined>(tx.objectStore(STORE).get(id));
    await done(tx);
    return record ?? null;
}

export async function putPlugin(plugin: StoredPlugin): Promise<void> {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(plugin);
    await done(tx);
}

export async function putPlugins(plugins: readonly StoredPlugin[]): Promise<void> {
    if (!plugins.length) return;
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const plugin of plugins) store.put(plugin);
    await done(tx);
}

export async function deletePlugin(id: string): Promise<void> {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    await done(tx);
}

/** 新记录的 order 追加到末尾。 */
export function nextOrder(plugins: readonly StoredPlugin[]): number {
    return plugins.reduce((max, plugin) => Math.max(max, plugin.order), -1) + 1;
}

export function makeStoredPlugin(
    manifest: PluginManifest,
    files: PluginFile[],
    order: number,
    source: PluginInstallSource,
    now: number,
): StoredPlugin {
    return {
        id: manifest.id,
        manifest,
        files,
        enabled: true,
        order,
        installedAt: now,
        updatedAt: now,
        source,
    };
}
