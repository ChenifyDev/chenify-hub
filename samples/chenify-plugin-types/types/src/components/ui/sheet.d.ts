import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
declare function SheetPortal({ ...props }: SheetPrimitive.Portal.Props): React.JSX.Element;
declare function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props): React.JSX.Element;
declare const Sheet: React.ComponentType<SheetPrimitive.Root.Props<unknown>>;
declare const SheetTrigger: React.ComponentType<SheetPrimitive.Trigger.Props<unknown>>;
declare const SheetClose: React.ComponentType<import("@base-ui/react").AlertDialogCloseProps>;
declare const SheetContent: React.ComponentType<import("@base-ui/react").AlertDialogPopupProps & {
    side?: "top" | "right" | "bottom" | "left";
    showCloseButton?: boolean;
}>;
declare const SheetHeader: React.ComponentType<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>;
declare const SheetFooter: React.ComponentType<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>;
declare const SheetTitle: React.ComponentType<import("@base-ui/react").AlertDialogTitleProps>;
declare const SheetDescription: React.ComponentType<import("@base-ui/react").AlertDialogDescriptionProps>;
export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetPortal, SheetOverlay, };
