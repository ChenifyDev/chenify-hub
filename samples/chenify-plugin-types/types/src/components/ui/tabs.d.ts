import { type VariantProps } from "class-variance-authority";
declare const tabsListVariants: (props?: ({
    variant?: "default" | "line" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
declare const Tabs: import("react").ComponentType<import("@base-ui/react/tabs").TabsRootProps>;
declare const TabsList: import("react").ComponentType<import("@base-ui/react/tabs").TabsListProps & VariantProps<(props?: ({
    variant?: "default" | "line" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string>>;
declare const TabsTrigger: import("react").ComponentType<import("@base-ui/react/tabs").TabsTabProps>;
declare const TabsContent: import("react").ComponentType<import("@base-ui/react/tabs").TabsPanelProps>;
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
