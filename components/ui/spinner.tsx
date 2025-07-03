import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-current border-t-transparent",
  {
    variants: {
      size: {
        small: "h-4 w-4",
        default: "h-6 w-6",
        large: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        default: "text-primary",
        secondary: "text-secondary",
        destructive: "text-destructive",
        outline: "text-border",
        ghost: "text-muted-foreground",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  show?: boolean;
}

const Spinner = ({
  className,
  size,
  variant,
  show = true,
  ...props
}: SpinnerProps) => {
  if (!show) return null;

  return (
    <div
      className={cn(spinnerVariants({ size, variant }), className)}
      {...props}
    />
  );
};

// Composant wrapper pour les états de chargement
export interface LoadingSpinnerProps {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  size?: "small" | "default" | "large" | "xl";
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
}

const LoadingSpinner = ({
  loading,
  children,
  fallback,
  className,
  size = "default",
  variant = "default",
}: LoadingSpinnerProps) => {
  if (loading) {
    return (
      fallback || (
        <div className={cn("flex items-center justify-center p-4", className)}>
          <Spinner size={size} variant={variant} />
        </div>
      )
    );
  }

  return <>{children}</>;
};

// Composant pour les boutons avec loading
export interface ButtonSpinnerProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}

const ButtonSpinner = ({
  loading,
  children,
  className,
}: ButtonSpinnerProps) => {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      {loading && <Spinner size="small" />}
      {children}
    </span>
  );
};

export { Spinner, LoadingSpinner, ButtonSpinner, spinnerVariants };
