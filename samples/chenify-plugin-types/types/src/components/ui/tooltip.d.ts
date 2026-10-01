import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
declare const Tooltip: import("react").ComponentType<TooltipPrimitive.Root.Props<unknown>>;
declare const TooltipTrigger: import("react").ComponentType<TooltipPrimitive.Trigger.Props<unknown>>;
declare const TooltipContent: import("react").ComponentType<import("@base-ui/react").TooltipPopupProps & Pick<import("@base-ui/react").TooltipPositionerProps, "align" | "alignOffset" | "side" | "sideOffset">>;
declare const TooltipProvider: import("react").ComponentType<import("@base-ui/react").TooltipProviderProps>;
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
