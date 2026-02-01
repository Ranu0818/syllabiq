import { forwardRef, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "static" | "accent";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    padding?: "none" | "sm" | "md" | "lg";
}

const variantClasses: Record<CardVariant, string> = {
    default: "glass-card",
    static: "glass-card-static",
    accent: "glass-card-accent",
};

const paddingClasses: Record<string, string> = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", padding = "md", children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(variantClasses[variant], paddingClasses[padding], className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> { }

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("mb-4", className)}
                {...props}
            />
        );
    }
);

CardHeader.displayName = "CardHeader";

// Card Title
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
    as?: "h1" | "h2" | "h3" | "h4";
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
    ({ className, as: Component = "h3", ...props }, ref) => {
        return (
            <Component
                ref={ref}
                className={cn("heading-3 font-semibold", className)}
                {...props}
            />
        );
    }
);

CardTitle.displayName = "CardTitle";

// Card Content
interface CardContentProps extends HTMLAttributes<HTMLDivElement> { }

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("text-[var(--text-secondary)]", className)}
                {...props}
            />
        );
    }
);

CardContent.displayName = "CardContent";

// Card Footer
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> { }

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("mt-4 flex items-center gap-2", className)}
                {...props}
            />
        );
    }
);

CardFooter.displayName = "CardFooter";
