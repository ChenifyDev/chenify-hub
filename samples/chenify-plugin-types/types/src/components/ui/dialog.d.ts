import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
declare const Dialog: React.ComponentType<DialogPrimitive.Root.Props<unknown>>;
declare const DialogTrigger: React.ComponentType<DialogPrimitive.Trigger.Props<unknown>>;
declare const DialogPortal: React.ComponentType<import("@base-ui/react").AlertDialogPortalProps>;
declare const DialogClose: React.ComponentType<import("@base-ui/react").AlertDialogCloseProps>;
declare const DialogOverlay: React.ComponentType<import("@base-ui/react").AlertDialogBackdropProps>;
declare const DialogContent: React.ComponentType<import("@base-ui/react").AlertDialogPopupProps & {
    showCloseButton?: boolean;
}>;
declare const DialogHeader: React.ComponentType<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>;
declare const DialogFooter: React.ComponentType<React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement> & {
    showCloseButton?: boolean;
}>;
declare const DialogTitle: React.ComponentType<import("@base-ui/react").AlertDialogTitleProps>;
declare const DialogDescription: React.ComponentType<import("@base-ui/react").AlertDialogDescriptionProps>;
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, };
