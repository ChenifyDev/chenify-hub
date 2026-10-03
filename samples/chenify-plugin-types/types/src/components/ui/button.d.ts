import { type VariantProps } from "class-variance-authority";
declare const buttonVariants: (
    props?:
        | ({
              variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined;
              size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg" | null | undefined;
          } & import("class-variance-authority/types").ClassProp)
        | undefined,
) => string;
declare const Button: import("react").ComponentType<
    import("@base-ui/react/button").ButtonProps &
        VariantProps<
            (
                props?:
                    | ({
                          variant?:
                              | "default"
                              | "secondary"
                              | "destructive"
                              | "outline"
                              | "ghost"
                              | "link"
                              | null
                              | undefined;
                          size?:
                              | "default"
                              | "xs"
                              | "sm"
                              | "lg"
                              | "icon"
                              | "icon-xs"
                              | "icon-sm"
                              | "icon-lg"
                              | null
                              | undefined;
                      } & import("class-variance-authority/types").ClassProp)
                    | undefined,
            ) => string
        >
>;
export { Button, buttonVariants };
