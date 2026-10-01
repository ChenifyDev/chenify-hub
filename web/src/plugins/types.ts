import type { ComponentProps } from "react";

import { PLUGIN_SLOT_MODULES } from "./slot-modules.ts";
import type { Badge } from "@/components/ui/badge";
import type { Button } from "@/components/ui/button";
import type {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { Checkbox } from "@/components/ui/checkbox";
import type { Input } from "@/components/ui/input";
import type { Label } from "@/components/ui/label";
import type { Separator } from "@/components/ui/separator";
import type { Skeleton } from "@/components/ui/skeleton";
import type { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type PluginInstallSource = "folder" | "zip" | "url";

export type PluginManifestUi = {
    style: string[];
    components: Partial<Record<PluginSlot, string>>;
};

export type PluginManifest = {
    id: string;
    name: string;
    version: string;
    author: string;
    description: string;
    ui: PluginManifestUi;
};

export type PluginFile =
    | { path: string; kind: "text"; text: string }
    | { path: string; kind: "binary"; bytes: ArrayBuffer };

export type StoredPlugin = {
    id: string;
    manifest: PluginManifest;
    files: PluginFile[];
    enabled: boolean;
    order: number;
    installedAt: number;
    updatedAt: number;
    source: PluginInstallSource;
};

export type PluginError = {
    pluginId: string;
    pluginName: string;
    slot?: string;
    message: string;
    at: number;
};

export type PluginSdk = {
    readonly id: string;
    readonly name: string;
    readonly version: string;
};

export { PLUGIN_SLOT_MODULES } from "./slot-modules.ts";

type LowerFirst<S extends string> = S extends `${infer Head}${infer Tail}` ? `${Lowercase<Head>}${Tail}` : S;

function lowerFirst<S extends string>(value: S): LowerFirst<S> {
    return (value.charAt(0).toLowerCase() + value.slice(1)) as LowerFirst<S>;
}

export type PluginSlot = LowerFirst<(typeof PLUGIN_SLOT_MODULES)[keyof typeof PLUGIN_SLOT_MODULES][number]>;

export const PLUGIN_SLOTS: readonly PluginSlot[] = Object.values(PLUGIN_SLOT_MODULES).flat().map(lowerFirst).sort();

const SLOT_SET = new Set<string>(PLUGIN_SLOTS);

export function isPluginSlot(name: string): name is PluginSlot {
    return SLOT_SET.has(name);
}

export function manifestSlotEntries(manifest: PluginManifest): [PluginSlot, string][] {
    return Object.entries(manifest.ui.components) as [PluginSlot, string][];
}

export interface PluginSlotComponents {
    button: typeof Button;
    card: typeof Card;
    cardHeader: typeof CardHeader;
    cardFooter: typeof CardFooter;
    cardTitle: typeof CardTitle;
    cardAction: typeof CardAction;
    cardDescription: typeof CardDescription;
    cardContent: typeof CardContent;
    badge: typeof Badge;
    input: typeof Input;
    label: typeof Label;
    separator: typeof Separator;
    skeleton: typeof Skeleton;
    checkbox: typeof Checkbox;
    tabs: typeof Tabs;
    tabsList: typeof TabsList;
    tabsTrigger: typeof TabsTrigger;
    tabsContent: typeof TabsContent;
}

export type PluginSlotComponentOf<S extends PluginSlot> = PluginSlotComponents[S];

export type SlotProps<S extends PluginSlot> = ComponentProps<PluginSlotComponentOf<S>>;

export type AnySlotComponent = PluginSlotComponentOf<PluginSlot>;

type Assert<T extends true> = T;

export type PluginSlotTableIsExhaustive = Assert<
    [Exclude<PluginSlot, keyof PluginSlotComponents>, Exclude<keyof PluginSlotComponents, PluginSlot>] extends [
        never,
        never,
    ]
        ? true
        : {
              missing: Exclude<PluginSlot, keyof PluginSlotComponents>;
              extra: Exclude<keyof PluginSlotComponents, PluginSlot>;
          }
>;

export const SCRIPT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"] as const;

const TEXT_EXTENSIONS = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".css",
    ".json",
    ".svg",
    ".txt",
    ".md",
    ".html",
    ".htm",
]);

export const isTextPath = (path: string) => TEXT_EXTENSIONS.has(path.slice(path.lastIndexOf(".")).toLowerCase());

export const isScriptPath = (path: string) => SCRIPT_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext));
