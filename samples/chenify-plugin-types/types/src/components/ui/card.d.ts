import * as React from "react";
declare const Card: React.ComponentType<React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement> & {
    size?: "default" | "sm";
}>;
declare const CardHeader: React.ComponentType<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>;
declare const CardTitle: React.ComponentType<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>;
declare const CardDescription: React.ComponentType<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>;
declare const CardAction: React.ComponentType<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>;
declare const CardContent: React.ComponentType<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>;
declare const CardFooter: React.ComponentType<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>;
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
