import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
declare const DropdownMenu: React.ComponentType<MenuPrimitive.Root.Props<unknown>>;
declare const DropdownMenuPortal: React.ComponentType<import("@base-ui/react").ContextMenuPortalProps>;
declare const DropdownMenuTrigger: React.ComponentType<MenuPrimitive.Trigger.Props<unknown>>;
declare const DropdownMenuContent: React.ComponentType<import("@base-ui/react").ContextMenuPopupProps & Pick<import("@base-ui/react").ContextMenuPositionerProps, "align" | "alignOffset" | "side" | "sideOffset">>;
declare const DropdownMenuGroup: React.ComponentType<import("@base-ui/react").ContextMenuGroupProps>;
declare const DropdownMenuLabel: React.ComponentType<import("@base-ui/react").ContextMenuGroupLabelProps & {
    inset?: boolean;
}>;
declare const DropdownMenuItem: React.ComponentType<import("@base-ui/react").ContextMenuItemProps & {
    inset?: boolean;
    variant?: "default" | "destructive";
}>;
declare const DropdownMenuCheckboxItem: React.ComponentType<import("@base-ui/react").ContextMenuCheckboxItemProps & {
    inset?: boolean;
}>;
declare const DropdownMenuRadioGroup: React.ComponentType<import("@base-ui/react").ContextMenuRadioGroupProps>;
declare const DropdownMenuRadioItem: React.ComponentType<import("@base-ui/react").ContextMenuRadioItemProps & {
    inset?: boolean;
}>;
declare const DropdownMenuSeparator: React.ComponentType<import("@base-ui/react").SeparatorProps>;
declare const DropdownMenuShortcut: React.ComponentType<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>>;
declare const DropdownMenuSub: React.ComponentType<import("@base-ui/react").ContextMenuSubmenuRootProps>;
declare const DropdownMenuSubTrigger: React.ComponentType<import("@base-ui/react").ContextMenuSubmenuTriggerProps & {
    inset?: boolean;
}>;
declare const DropdownMenuSubContent: React.ComponentType<import("@base-ui/react").ContextMenuPopupProps & Pick<import("@base-ui/react").ContextMenuPositionerProps, "align" | "alignOffset" | "side" | "sideOffset">>;
export { DropdownMenu, DropdownMenuPortal, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, };
