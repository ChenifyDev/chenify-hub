import { type VariantProps } from "class-variance-authority";
declare const badgeVariants: (props?: ({
    variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
declare const Badge: import("react").ComponentType<import("react").ClassAttributes<HTMLSpanElement> & import("react").HTMLAttributes<HTMLSpanElement> & {
    render?: import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | import("@base-ui/react/types").ComponentRenderFn<import("@base-ui/react/types").HTMLProps, {}> | undefined;
} & VariantProps<(props?: ({
    variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string>>;
export { Badge, badgeVariants };
