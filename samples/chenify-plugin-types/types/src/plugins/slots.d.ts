/**
 * 插槽 → 宿主组件类型。
 *
 * 全文件只有 `import type`：运行时不存在这个模块，宿主的模块图一点没变，
 * 但插件作者能由此拿到每个插槽真实的 props 类型（见 authoring.ts 与生成的类型包）。
 *
 * props 类型是从真实组件推导出来的，宿主改了 props 这里自动跟着变；
 * 键集合与 PLUGIN_SLOT_MODULES 是否一致，由文件末尾的编译期断言守住。
 */
import type { ComponentProps } from "react";
import type { Badge } from "@/components/ui/badge";
import type { Button } from "@/components/ui/button";
import type { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Checkbox } from "@/components/ui/checkbox";
import type { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Input } from "@/components/ui/input";
import type { Label } from "@/components/ui/label";
import type { Separator } from "@/components/ui/separator";
import type { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Skeleton } from "@/components/ui/skeleton";
import type { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PluginSlot } from "./types";
export type { PluginSlot };
/**
 * 插槽名 → 宿主组件类型。
 *
 * 这里写的是宿主被 withPluginUI 包过之后的导出类型，也就是插件会拿到的 props 契约；
 * 插件组件的签名直接用 SlotProps<"button">，与真实实现同源，不会各写各的。
 */
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
    dialog: typeof Dialog;
    dialogTrigger: typeof DialogTrigger;
    dialogPortal: typeof DialogPortal;
    dialogClose: typeof DialogClose;
    dialogOverlay: typeof DialogOverlay;
    dialogContent: typeof DialogContent;
    dialogHeader: typeof DialogHeader;
    dialogFooter: typeof DialogFooter;
    dialogTitle: typeof DialogTitle;
    dialogDescription: typeof DialogDescription;
    sheet: typeof Sheet;
    sheetTrigger: typeof SheetTrigger;
    sheetClose: typeof SheetClose;
    sheetContent: typeof SheetContent;
    sheetHeader: typeof SheetHeader;
    sheetFooter: typeof SheetFooter;
    sheetTitle: typeof SheetTitle;
    sheetDescription: typeof SheetDescription;
    dropdownMenu: typeof DropdownMenu;
    dropdownMenuPortal: typeof DropdownMenuPortal;
    dropdownMenuTrigger: typeof DropdownMenuTrigger;
    dropdownMenuContent: typeof DropdownMenuContent;
    dropdownMenuGroup: typeof DropdownMenuGroup;
    dropdownMenuLabel: typeof DropdownMenuLabel;
    dropdownMenuItem: typeof DropdownMenuItem;
    dropdownMenuCheckboxItem: typeof DropdownMenuCheckboxItem;
    dropdownMenuRadioGroup: typeof DropdownMenuRadioGroup;
    dropdownMenuRadioItem: typeof DropdownMenuRadioItem;
    dropdownMenuSeparator: typeof DropdownMenuSeparator;
    dropdownMenuShortcut: typeof DropdownMenuShortcut;
    dropdownMenuSub: typeof DropdownMenuSub;
    dropdownMenuSubTrigger: typeof DropdownMenuSubTrigger;
    dropdownMenuSubContent: typeof DropdownMenuSubContent;
    tooltip: typeof Tooltip;
    tooltipTrigger: typeof TooltipTrigger;
    tooltipContent: typeof TooltipContent;
    tooltipProvider: typeof TooltipProvider;
}
/** 某个插槽对应的宿主组件类型。 */
export type PluginSlotComponentOf<S extends PluginSlot> = PluginSlotComponents[S];
/**
 * 某个插槽的 props 类型，插件组件的签名用它：
 *
 * ```tsx
 * import { useHostUI, type SlotProps } from "@/plugins/api";
 *
 * export default function Button(props: SlotProps<"button">) { ... }
 * ```
 *
 * 只用 `import type` 引它：sucrase 会把整条 import 擦掉，运行时不需要这个导出。
 */
export type SlotProps<S extends PluginSlot> = ComponentProps<PluginSlotComponentOf<S>>;
/** 宿主组件 props 的宽类型：55 个插槽的组件类型各不相同，塞进覆盖表/数组时用它。 */
export type AnySlotComponent = PluginSlotComponentOf<PluginSlot>;
type Assert<T extends true> = T;
/**
 * 编译期断言：上面的映射表与 PLUGIN_SLOT_MODULES 的插槽集合完全一致。
 *
 * 宿主新增或删除一个可替换组件时，这行会变成编译错误，
 * 而不用等到有人写错插槽名才发现少了一个类型。
 */
export type PluginSlotTableIsExhaustive = Assert<[
    Exclude<PluginSlot, keyof PluginSlotComponents>,
    Exclude<keyof PluginSlotComponents, PluginSlot>
] extends [never, never] ? true : {
    missing: Exclude<PluginSlot, keyof PluginSlotComponents>;
    extra: Exclude<keyof PluginSlotComponents, PluginSlot>;
}>;
