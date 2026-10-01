import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import * as path from "node:path";
import * as fs from "node:fs";

const API_PATH = loadEnv("development", path.resolve(__dirname, "..")).VITE_API_PATH;

const HOST_MODULES_ID = "virtual:chenify-plugin-host";
const RESOLVED_HOST_MODULES_ID = `\0${HOST_MODULES_ID}`;
const LUCIDE_ICONS_ID = "virtual:chenify-plugin-lucide-icons";
const RESOLVED_LUCIDE_ICONS_ID = `\0${LUCIDE_ICONS_ID}`;

/** internals 是 base-ui 的私有实现，docs/utils 也不是组件入口，都不暴露给插件。 */
const EXCLUDED_BASE_UI_SUBPATH = /^\.\/(package\.json|internals\/|docs\/|utils\/)/;

/**
 * 逐个读取 lucide 的图标文件，取出组件名。
 *
 * 不能直接 `import * as Lucide from "lucide-react"` 或 `import("lucide-react")`：
 * 那是命名空间导入，会把两千多个图标全部标记为「已使用」。而 lucide-react.mjs 本身
 * 因为应用自己 import 过一部分图标而已经在主包里，于是这六百多 KB 会赖在主包里不走，
 * rolldown 也会报 INEFFECTIVE_DYNAMIC_IMPORT。改成按文件 re-export 长尾即可让它们
 * 单独成 chunk，插件真用到才下载。
 */
/** 依赖可能装在本包或 workspace 根的 node_modules（取决于安装布局），两处都找。 */
function resolvePackageDir(root: string, name: string): string | undefined {
    for (const base of [root, path.resolve(root, "..")]) {
        const dir = path.join(base, "node_modules", ...name.split("/"));
        if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    }
    return undefined;
}

function readLucideIcons(root: string): { kebab: string; name: string }[] {
    const pkgDir = resolvePackageDir(root, "lucide-react");
    if (!pkgDir) return [];
    const dir = path.join(pkgDir, "dist/esm/icons");
    if (!fs.existsSync(dir)) return [];
    const out: { kebab: string; name: string }[] = [];
    for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith(".mjs")) continue;
        const source = fs.readFileSync(path.join(dir, file), "utf8");
        const name = /const\s+([A-Za-z0-9_$]+)\s*=\s*createLucideIcon\(/.exec(source)?.[1];
        if (name) out.push({ kebab: file.slice(0, -".mjs".length), name });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 收集 @base-ui/react 的全部公开子路径。
 * 用包自身的 exports 字段做权威来源，升级 base-ui 时无需手工维护清单。
 */
function readBaseUiSubpaths(root: string): string[] {
    const pkgDir = resolvePackageDir(root, "@base-ui/react");
    if (!pkgDir) return [];
    const pkgPath = path.join(pkgDir, "package.json");
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { exports?: Record<string, unknown> };
        return Object.keys(pkg.exports ?? {})
            .filter((key) => key.startsWith("./") && !EXCLUDED_BASE_UI_SUBPATH.test(key))
            .map((key) => `@base-ui/react/${key.slice(2)}`)
            .sort();
    } catch {
        return [];
    }
}

/** 递归收集 src/ 下的源码文件。 */
function listSourceFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...listSourceFiles(full));
        else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
    }
    return out;
}

/**
 * 收集应用自己已经用到的 lucide 图标。
 *
 * 这些图标本来就在主包里，把它们直接暴露给插件是零成本的；插件若要用应用没用过的图标，
 * 才需要按需拉取整个 lucide-react（约 60KB gzip，只加载一次）。
 */
function readAppLucideIcons(root: string): string[] {
    const icons = new Set<string>();
    const pattern = /import\s*\{([^}]*)}\s*from\s*["']lucide-react["']/g;
    for (const file of listSourceFiles(path.resolve(root, "src"))) {
        const code = fs.readFileSync(file, "utf8");
        for (const match of code.matchAll(pattern)) {
            for (const raw of match[1].split(",")) {
                const entry = raw.trim();
                // 纯类型导入（type X / type X as Y）运行时并不存在，不能生成静态 import
                if (!entry || /^type\s/.test(entry)) continue;
                // 别名导入要取的是包里真实存在的那个名字，插件也是按它来 import 的
                const name = entry.split(/\s+as\s+/)[0].trim();
                if (/^[A-Za-z_$][\w$]*$/.test(name)) icons.add(name);
            }
        }
    }
    return [...icons].sort();
}

/**
 * 生成 virtual:chenify-plugin-host —— UI 插件可用的宿主模块表。
 *
 * 这些模块用动态 import 而非静态 import，是为了让没用插件的用户不必为 base-ui 的全部
 * 组件和 lucide 的上千个图标付出打包体积；插件启用时运行时才会按需加载对应 chunk。
 */
function pluginHostModules(root: string): Plugin {
    return {
        name: "chenify:plugin-host-modules",
        resolveId(id) {
            if (id === HOST_MODULES_ID) return RESOLVED_HOST_MODULES_ID;
            if (id === LUCIDE_ICONS_ID) return RESOLVED_LUCIDE_ICONS_ID;
            return null;
        },
        load(id) {
            if (id === RESOLVED_LUCIDE_ICONS_ID) {
                // 应用自己用到的图标本来就在主包里，长尾没必要再导一遍
                const appIcons = new Set(readAppLucideIcons(root));
                const tail = readLucideIcons(root).filter((icon) => !appIcons.has(icon.name));
                if (!tail.length) return "export {};\n";
                const lines = tail.map(
                    (icon) =>
                        `export { default as ${icon.name} } from "lucide-react/dist/esm/icons/${icon.kebab}.mjs";`,
                );
                return `${lines.join("\n")}\n`;
            }

            if (id !== RESOLVED_HOST_MODULES_ID) return null;

            const subpaths = readBaseUiSubpaths(root);
            if (!subpaths.length) {
                this.warn("未找到 @base-ui/react 的 exports 字段，UI 插件将无法 import Base UI 组件");
            }
            const baseUiEntries = [
                `  "@base-ui/react": () => import("@base-ui/react"),`,
                ...subpaths.map((subpath) => `  ${JSON.stringify(subpath)}: () => import(${JSON.stringify(subpath)}),`),
            ].join("\n");

            // 这些图标应用自己就在用，静态引入不额外增加体积
            const icons = readAppLucideIcons(root);
            const iconImport = icons.length ? `import { ${icons.join(", ")} } from "lucide-react";\n` : "";
            const iconEntries = icons.map((name) => `  ${JSON.stringify(name)}: ${name},`).join("\n");
            const iconTable = icons.length ? `{\n${iconEntries}\n}` : "{}";

            return [
                iconImport,
                `export const baseUiModules = {\n${baseUiEntries}\n};`,
                `export const lucideStaticModules = ${iconTable};`,
                `export const loadLucideIcons = () => import(${JSON.stringify(LUCIDE_ICONS_ID)});`,
            ].join("\n");
        },
    };
}

// https://vite.dev/config/
export default defineConfig({
    envDir: path.resolve(__dirname, ".."),
    plugins: [react(), tailwindcss(), pluginHostModules(__dirname)],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
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
});
