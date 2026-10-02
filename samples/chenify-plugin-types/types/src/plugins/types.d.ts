import type { ComponentProps } from "react";
import { PLUGIN_SLOT_MODULES } from "./slot-modules";
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
    | {
          path: string;
          kind: "text";
          text: string;
      }
    | {
          path: string;
          kind: "binary";
          bytes: ArrayBuffer;
      };
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
export { PLUGIN_SLOT_MODULES } from "./slot-modules";
type LowerFirst<S extends string> = S extends `${infer Head}${infer Tail}` ? `${Lowercase<Head>}${Tail}` : S;
export type PluginSlot = LowerFirst<(typeof PLUGIN_SLOT_MODULES)[keyof typeof PLUGIN_SLOT_MODULES][number]>;
export declare const PLUGIN_SLOTS: readonly PluginSlot[];
export declare function isPluginSlot(name: string): name is PluginSlot;
export declare function manifestSlotEntries(manifest: PluginManifest): [PluginSlot, string][];
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
export declare const SCRIPT_EXTENSIONS: readonly [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
export declare const isTextPath: (path: string) => boolean;
export declare const isScriptPath: (path: string) => boolean;
