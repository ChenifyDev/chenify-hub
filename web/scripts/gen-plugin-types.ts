/**
 * 生成给插件作者用的类型包。
 *
 * 宿主组件的 props 就是插件组件的 props 契约，所以类型直接从 src 生成，
 * 不维护第二份手写清单 —— 宿主改了 variant、加了 prop，作者下次拿到的类型自动跟着变。
 *
 * 产物（全部是生成物，不进版本库）：
 *   node_modules/.tmp/plugin-types/src/**.d.ts   emit 出来的声明树
 *   public/chenify-plugin-types/                 /plugins 页面上「下载类型模板」给的就是它
 *
 * /plugins 页面只做一次 fetch，所以这里连散文件一起打出 zip，页面不用自己打包。
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { zipSync } from "fflate";
import * as ts from "typescript";

import { PLUGIN_SLOT_MODULES } from "../src/plugins/slot-modules.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, "tsconfig.plugin-types.json");
const publicDir = path.join(root, "public", "chenify-plugin-types");
const zipPath = path.join(publicDir, "chenify-plugin-types.zip");

/** 作者工程的 tsconfig 基线。paths 指向同目录下的声明树，作者自己的 tsconfig extends 它。 */
const authorTsconfig = {
    $schema: "https://json.schemastore.org/tsconfig",
    compilerOptions: {
        target: "es2023",
        lib: ["ES2023", "DOM"],
        module: "esnext",
        moduleResolution: "bundler",
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        allowImportingTsExtensions: true,
        verbatimModuleSyntax: true,
        paths: { "@/*": ["./types/src/*"] },
    },
};

const readme = `# ChenifyHub 插件类型模板

这是从站点源码生成的类型声明，**不属于你的插件包**。解压后放在插件目录的隔壁：

\`\`\`
workspace/
├── my-plugin/                 ← 拖进 /plugins 的只有这个
│   ├── plugin.json
│   ├── ui/button.tsx
│   └── tsconfig.json          ← { "extends": "../chenify-plugin-types/tsconfig.json", "include": ["ui"] }
└── chenify-plugin-types/      ← 本目录
\`\`\`

## 依赖

\`\`\`bash
npm i -D typescript @types/react
\`\`\`

这样就能开始写了：\`card*\` \`input\` \`label\` \`skeleton\` \`separator\`
这些纯 DOM 的插槽立刻是字段级精确的。

其余插槽（\`button\` \`badge\` \`checkbox\` \`tabs*\`）的 props 来自 Base UI 原语。**不装
\`@base-ui/react\` 也能编** —— 那部分 props 退化成 \`any\`，不报错、也不校验。
想要字段级类型，就按站点的版本补上这几个包：

\`\`\`bash
npm i -D @base-ui/react class-variance-authority
\`\`\`

## 怎么用

\`\`\`tsx
import { cn } from "@/lib/utils";
import { useHostUI, type SlotProps } from "@/plugins/api";

export default function Button(props: SlotProps<"button">) {
    const Host = useHostUI("button");
    if (!Host) return null;
    return <Host {...props} className={cn("rounded-full", props.className)} />;
}
\`\`\`

\`plugin.json\` 也有校验：把 \`plugin.schema.json\` 拷一份到插件根目录，
编辑器就会补全插槽名，并把拼错的、未声明的插槽标红。

宿主改过组件 props 后，这个类型包是旧的；重新下载即可。
`;

function lowerFirst(value: string): string {
    return value.charAt(0).toLowerCase() + value.slice(1);
}

/** plugin.json 的 JSON Schema：插槽名由 PLUGIN_SLOT_MODULES 生成，写错会被标红。 */
function pluginSchema(): unknown {
    const components: Record<string, unknown> = {};
    const files: Record<string, string[]> = {};
    for (const [file, names] of Object.entries(PLUGIN_SLOT_MODULES)) {
        files[file] = [...names];
        for (const name of names) {
            const slot = lowerFirst(name);
            components[slot] = {
                type: "string",
                default: `ui/${slot}.tsx`,
                markdownDescription: `替换宿主的 \`${name}\`（宿主文件 \`${file}\`），模块的 default 导出即替换组件。props 类型见 \`SlotProps<"${slot}">\`。`,
            };
        }
    }

    return {
        $schema: "http://json-schema.org/draft-07/schema#",
        title: "ChenifyHub UI 插件清单",
        type: "object",
        required: ["id", "name", "ui"],
        properties: {
            id: {
                type: "string",
                pattern: "^[a-z0-9][a-z0-9._-]{0,63}$",
                description:
                    "唯一标识，只能是小写字母、数字与 . _ -，且以字母或数字开头，最长 64 位。重复安装视为更新。",
            },
            name: { type: "string", minLength: 1, description: "展示名。" },
            version: { type: "string", default: "0.0.0" },
            author: { type: "string" },
            description: { type: "string" },
            ui: {
                type: "object",
                additionalProperties: false,
                properties: {
                    style: {
                        type: "array",
                        items: { type: "string" },
                        description: "注入 <head> 的 CSS 文件路径，卸载时自动移除。",
                    },
                    components: {
                        type: "object",
                        description: "插槽名 → 替换宿主组件的 .tsx 模块路径。ui.style 与 ui.components 至少要有一个。",
                        properties: components,
                        additionalProperties: false,
                    },
                },
            },
            files: {
                type: "array",
                items: { type: "string" },
                description: "只有「从 URL 安装」才需要：列出包内全部文件，且必须包含 plugin.json 自己。",
            },
        },
        // 宿主文件与插槽名清单，纯粹给人和工具参考（自定义关键字，校验器会忽略）
        "x-slots": Object.keys(components).sort(),
        "x-slot-modules": files,
    };
}

function* walk(dir: string): Generator<string> {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) yield* walk(full);
        else yield full;
    }
}

function reportDiagnostics(diagnostics: readonly ts.Diagnostic[]): void {
    for (const diagnostic of diagnostics) {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
        if (diagnostic.file && diagnostic.start !== undefined) {
            const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            console.error(`${path.relative(root, diagnostic.file.fileName)}:${line + 1}:${character + 1} ${message}`);
        } else {
            console.error(message);
        }
    }
}

function fail(message: string): never {
    console.error(`[plugin-types] ${message}`);
    process.exit(1);
}

// 1. 建程序、emit 声明。入口只有 authoring.ts，emit 出来就只有作者能碰到的模块。
const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
if (error) {
    reportDiagnostics([error]);
    fail("tsconfig.plugin-types.json 读不出来");
}
const parsed = ts.parseJsonConfigFileContent(config, ts.sys, root, undefined, configPath);
if (parsed.errors.length) {
    reportDiagnostics(parsed.errors);
    fail("tsconfig.plugin-types.json 里有错误");
}
const outDir = parsed.options.outDir;
if (!outDir) fail("tsconfig.plugin-types.json 缺少 outDir");

const started = Date.now();
// 临时目录先清干净：配置改了 rootDir 之类的，旧文件残留会被一起拷进类型包
rmSync(outDir, { recursive: true, force: true });
const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options });
const emitted = program.emit();
// 只看语法与 emit 阶段的诊断：应用自身的类型错误由 tsc -b 负责，
// 这里独有价值的是「声明 emit 自己会报错」的那些问题（比如别名路径带 .tsx 后缀），
// 多跑一遍全量语义检查要多花好几秒，不值。
const errors = [...program.getSyntacticDiagnostics(), ...emitted.diagnostics].filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
);
if (errors.length) {
    reportDiagnostics(errors);
    fail(`声明 emit 失败（${errors.length} 个类型错误），不会产出类型包`);
}
if (!existsSync(outDir)) fail(`emit 结束却没有产出 ${outDir}`);

// 2. import 后缀。仓库里两种写法混用（"@/plugins/api" 与 "@/plugins/api.tsx"），
//    TS 只会改写相对路径那种，别名路径会带着 .tsx 落到 d.ts 里，作者那边就解析不到了。
//    统一去掉后缀：作者的工程是 moduleResolution: bundler，无后缀的相对/别名路径都能解析。
let rewritten = 0;
for (const file of walk(outDir)) {
    if (!file.endsWith(".d.ts")) continue;
    const source = readFileSync(file, "utf8");
    const fixed = source.replace(/(["'])((?:\.{1,2}\/|@\/)[^"'\n]*?)\.tsx?\1/g, (_all, quote: string, path: string) => {
        rewritten += 1;
        return `${quote}${path}${quote}`;
    });
    if (fixed !== source) writeFileSync(file, fixed);
}

// 3. 组装模板目录。emit 已经成功，这时才动 public/，不会把上一份好的类型包弄丢。
rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });
// 声明树的结构就是 rootDir 决定的：types/src/…，作者的 paths 照着它写
cpSync(outDir, path.join(publicDir, "types"), { recursive: true });

writeFileSync(path.join(publicDir, "tsconfig.json"), `${JSON.stringify(authorTsconfig, null, 4)}\n`);
writeFileSync(path.join(publicDir, "plugin.schema.json"), `${JSON.stringify(pluginSchema(), null, 4)}\n`);
writeFileSync(path.join(publicDir, "README.md"), readme);

// 4. 打包：页面只 fetch 一次，不用自己拼 zip。
const entries: Record<string, Uint8Array> = {};
for (const file of walk(publicDir)) {
    entries[path.relative(publicDir, file).split(path.sep).join("/")] = new Uint8Array(readFileSync(file));
}
const zip = zipSync(entries, { level: 9 });
writeFileSync(zipPath, zip);

const count = [...walk(path.join(publicDir, "types"))].length;
console.log(
    `[plugin-types] ${count} 个 .d.ts，修正 ${rewritten} 处相对后缀，` +
        `zip ${(zip.byteLength / 1024).toFixed(0)}KB，用时 ${((Date.now() - started) / 1000).toFixed(1)}s`,
);
console.log(`[plugin-types] ${path.relative(root, zipPath)} (${statSync(zipPath).size} bytes)`);
