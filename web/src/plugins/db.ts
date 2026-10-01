import type { StoredPlugin } from "./types.ts";

const DB_NAME = "chenify-plugins";
const STORE = "plugins";

let opening: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
    if (opening) return opening;
    opening = new Promise<IDBDatabase>((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
            reject(new Error("当前浏览器不支持 IndexedDB，无法保存插件"));
            return;
        }
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            const store = request.result.objectStoreNames;
            if (!store.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" });
        };
        request.onsuccess = () => {
            const db = request.result;
            db.onversionchange = () => db.close();
            resolve(db);
        };
        request.onerror = () => reject(request.error ?? new Error("打开插件数据库失败"));
        request.onblocked = () => reject(new Error("插件数据库被其他标签页占用，请关闭其他标签页后重试"));
    });
    opening.catch(() => {
        opening = null;
    });
    return opening;
}

const completed = <T>(request: IDBRequest<T>): Promise<T> =>
    new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB 请求失败"));
    });

const settled = (tx: IDBTransaction): Promise<void> =>
    new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB 事务失败"));
        tx.onabort = () => reject(tx.error ?? new Error("IndexedDB 事务被中止"));
    });

async function transact<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const tx = (await openDb()).transaction(STORE, mode);
    const value = await completed(run(tx.objectStore(STORE)));
    await settled(tx);
    return value;
}

export async function listPlugins(): Promise<StoredPlugin[]> {
    const plugins: StoredPlugin[] = await transact("readonly", (store) => store.getAll());
    return plugins.sort((a, b) => a.order - b.order);
}

export async function putPlugin(plugin: StoredPlugin): Promise<void> {
    await transact("readwrite", (store) => store.put(plugin));
}

export async function putPlugins(plugins: readonly StoredPlugin[]): Promise<void> {
    if (!plugins.length) return;
    const tx = (await openDb()).transaction(STORE, "readwrite");
    for (const plugin of plugins) tx.objectStore(STORE).put(plugin);
    await settled(tx);
}

export async function deletePlugin(id: string): Promise<void> {
    await transact("readwrite", (store) => store.delete(id));
}
