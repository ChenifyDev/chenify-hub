import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Download,
    FolderOpen,
    Link2,
    Package,
    Puzzle,
    RefreshCw,
    Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import Empty from "@/components/tab/Empty.tsx";
import { installFromFolder, installFromUrl, installFromZip } from "@/plugins/install.ts";
import { usePluginStore } from "@/plugins/store.ts";
import type { PluginInstallSource, StoredPlugin } from "@/plugins/types.ts";
import { manifestSlotEntries } from "@/plugins/types.ts";

const SOURCE_LABEL: Record<PluginInstallSource, string> = {
    folder: "本地文件夹",
    zip: "ZIP 包",
    url: "远程 URL",
};

/** 类型模板由 scripts/gen-plugin-types.ts 生成并打在这里，见 docs/PLUGIN.md §5。 */
const TYPES_URL = `${import.meta.env.BASE_URL}chenify-plugin-types/chenify-plugin-types.zip`;

function formatTime(value: number): string {
    return new Date(value).toLocaleString();
}

export default function PluginsPage() {
    const plugins = usePluginStore((s) => s.plugins);
    const ready = usePluginStore((s) => s.ready);
    const loadError = usePluginStore((s) => s.loadError);
    const errors = usePluginStore((s) => s.errors);
    const setEnabled = usePluginStore((s) => s.setEnabled);
    const uninstall = usePluginStore((s) => s.uninstall);
    const move = usePluginStore((s) => s.move);
    const load = usePluginStore((s) => s.load);
    const clearErrors = usePluginStore((s) => s.clearErrors);

    const folderInput = useRef<HTMLInputElement>(null);
    const zipInput = useRef<HTMLInputElement>(null);
    const [url, setUrl] = useState("");
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
    // 类型包是构建产物，站点上不一定存在（没跑过 gen:plugin-types 的开发环境就没有）
    const [hasTypes, setHasTypes] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        void fetch(TYPES_URL, { method: "HEAD" })
            .then((res) => {
                if (!cancelled) setHasTypes(res.ok);
            })
            .catch(() => {
                if (!cancelled) setHasTypes(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const sorted = useMemo(() => [...plugins].sort((a, b) => a.order - b.order), [plugins]);
    const errorsByPlugin = useMemo(() => {
        const map = new Map<string, number>();
        for (const error of errors) map.set(error.pluginId, (map.get(error.pluginId) ?? 0) + 1);
        return map;
    }, [errors]);

    async function run(action: () => Promise<unknown>, success: string): Promise<void> {
        setBusy(true);
        setNotice(null);
        try {
            await action();
            setNotice({ kind: "ok", text: success });
        } catch (err) {
            setNotice({ kind: "error", text: err instanceof Error ? err.message : String(err) });
        } finally {
            setBusy(false);
        }
    }

    const onFolder = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        event.target.value = "";
        if (!files.length) return;
        void run(() => installFromFolder(files), "插件已从本地文件夹安装");
    };

    const onZip = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        void run(() => installFromZip(file), "插件已从 ZIP 安装");
    };

    const onUrl = () => {
        const target = url.trim();
        if (!target) return;
        void run(async () => {
            await installFromUrl(target);
            setUrl("");
        }, "插件已从远程 URL 安装");
    };

    const downloadTypes = () =>
        void run(async () => {
            const res = await fetch(TYPES_URL);
            if (!res.ok) throw new Error("类型包还没生成，先在仓库里跑一次 `gen:plugin-types`");
            const objectUrl = URL.createObjectURL(await res.blob());
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = "chenify-plugin-types.zip";
            link.click();
            // 立刻 revoke 会让部分浏览器拿不到内容
            setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
        }, "类型模板已开始下载，解压后放在插件目录隔壁");

    return (
        <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
            <header className="mb-4 flex items-center justify-between gap-2">
                <h1 className="flex items-center gap-2 text-xl font-semibold">
                    <Puzzle className="size-5" />
                    插件
                </h1>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void run(load, "已重新读取插件列表")}
                >
                    <RefreshCw />
                    重新读取
                </Button>
            </header>

            <p className="mb-4 text-sm text-muted-foreground">
                插件可以整体替换站点的界面组件。插件代码会在你的浏览器里执行，<strong>只请安装你信任的插件</strong>。
            </p>

            {loadError && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>读取已安装插件失败：{loadError}</span>
                </div>
            )}

            {notice && (
                <div
                    className={
                        notice.kind === "ok"
                            ? "mb-4 rounded-lg border border-border bg-muted/50 p-3 text-sm"
                            : "mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                    }
                >
                    {notice.kind === "error" && <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
                    <span className="min-w-0 wrap-break-word">{notice.text}</span>
                </div>
            )}

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="size-4" />
                        安装插件
                    </CardTitle>
                    <CardDescription>
                        插件包根目录需要包含 <code className="font-mono">plugin.json</code> 和{" "}
                        <code className="font-mono">ui/</code> 目录。从 URL 安装时地址指向{" "}
                        <code className="font-mono">plugin.json</code>，且它需要用{" "}
                        <code className="font-mono">files</code> 数组列出包内所有文件。
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" disabled={busy} onClick={() => folderInput.current?.click()}>
                            <FolderOpen />
                            选择文件夹
                        </Button>
                        <Button variant="outline" disabled={busy} onClick={() => zipInput.current?.click()}>
                            <Package />
                            选择 ZIP
                        </Button>
                        <input
                            ref={folderInput}
                            type="file"
                            multiple
                            hidden
                            // 目录选择没有标准属性，webkitdirectory 是各浏览器的既成事实
                            {...{ webkitdirectory: "", directory: "" }}
                            onChange={onFolder}
                        />
                        <input ref={zipInput} type="file" accept=".zip" hidden onChange={onZip} />
                    </div>

                    <div className="grid gap-1">
                        <Button
                            variant="outline"
                            disabled={busy || !hasTypes}
                            title={
                                hasTypes === false
                                    ? "当前站点没有类型包，在仓库里跑一次 gen:plugin-types 试试"
                                    : undefined
                            }
                            onClick={downloadTypes}
                        >
                            <Download />
                            下载类型模板
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            解压到插件目录隔壁，插件的 <code className="font-mono">tsconfig.json</code>{" "}
                            <code className="font-mono">extends</code> 它，就能拿到每个插槽真实的 props 类型， 以及{" "}
                            <code className="font-mono">plugin.json</code> 的插槽名补全。
                        </p>
                    </div>

                    <Separator />

                    <div className="grid gap-2">
                        <Label htmlFor="plugin-url">从 URL 安装</Label>
                        <div className="flex gap-2">
                            <Input
                                id="plugin-url"
                                value={url}
                                placeholder="https://example.com/plugin/plugin.json"
                                onChange={(event) => setUrl(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") onUrl();
                                }}
                            />
                            <Button disabled={busy || !url.trim()} onClick={onUrl}>
                                <Link2 />
                                安装
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {errors.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="size-4" />
                            运行时错误
                        </CardTitle>
                        <CardDescription>出错的组件已自动降级为默认外观，修复插件文件后可重新安装。</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        {errors.map((error, index) => (
                            <div
                                key={`${error.at}-${index}`}
                                className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm"
                            >
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">{error.pluginName}</span>
                                    {error.slot && <code className="font-mono">{error.slot}</code>}
                                    <span>{formatTime(error.at)}</span>
                                </div>
                                <p className="mt-1 wrap-break-word text-destructive">{error.message}</p>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-fit" onClick={() => clearErrors()}>
                            清空错误
                        </Button>
                    </CardContent>
                </Card>
            )}

            <h2 className="mb-2 text-sm font-medium text-muted-foreground">已安装（{sorted.length}）</h2>

            {!ready ? (
                <Skeleton className="h-24 w-full" />
            ) : sorted.length === 0 ? (
                <Empty text="还没有安装任何插件" />
            ) : (
                <ul className="grid gap-3">
                    {sorted.map((plugin, index) => (
                        <PluginRow
                            key={plugin.id}
                            plugin={plugin}
                            index={index}
                            total={sorted.length}
                            busy={busy}
                            errorCount={errorsByPlugin.get(plugin.id) ?? 0}
                            onToggle={(enabled) =>
                                void run(() => setEnabled(plugin.id, enabled), enabled ? "插件已启用" : "插件已停用")
                            }
                            onMove={(direction) => void run(() => move(plugin.id, direction), "已调整覆盖顺序")}
                            onUninstall={() => void run(() => uninstall(plugin.id), `已卸载 ${plugin.manifest.name}`)}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

type PluginRowProps = {
    plugin: StoredPlugin;
    index: number;
    total: number;
    busy: boolean;
    errorCount: number;
    onToggle: (enabled: boolean) => void;
    onMove: (direction: -1 | 1) => void;
    onUninstall: () => void;
};

function PluginRow({ plugin, index, total, busy, errorCount, onToggle, onMove, onUninstall }: PluginRowProps) {
    const slots = manifestSlotEntries(plugin.manifest)
        .map(([slot]) => slot)
        .sort();
    return (
        <li>
            <Card size="sm">
                <CardContent className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{plugin.manifest.name}</span>
                            <Badge variant="outline">{plugin.manifest.version}</Badge>
                            <Badge variant="secondary">{SOURCE_LABEL[plugin.source]}</Badge>
                            {errorCount > 0 && <Badge variant="destructive">{errorCount} 个错误</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{plugin.manifest.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {plugin.manifest.author} · 安装于 {formatTime(plugin.installedAt)}
                        </p>
                        {slots.length > 0 && (
                            <p className="mt-2 flex flex-wrap gap-1">
                                {slots.map((slot) => (
                                    <code
                                        key={slot}
                                        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                                    >
                                        {slot}
                                    </code>
                                ))}
                            </p>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={busy || index === 0}
                            title="上移，覆盖优先级更高"
                            onClick={() => onMove(1)}
                        >
                            <ArrowUp />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={busy || index === total - 1}
                            title="下移，覆盖优先级更低"
                            onClick={() => onMove(-1)}
                        >
                            <ArrowDown />
                        </Button>
                        <Button variant="ghost" size="sm" disabled={busy} onClick={() => onToggle(!plugin.enabled)}>
                            {plugin.enabled ? "停用" : "启用"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={busy}
                            className="text-destructive hover:text-destructive"
                            title="卸载"
                            onClick={onUninstall}
                        >
                            <Trash2 />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </li>
    );
}
