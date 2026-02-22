import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-semibold transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white",
        secondary: "bg-primary-50 text-primary",
        outline: "border border-border text-foreground",
        success: "bg-green-50 text-green-700",
        warning: "bg-amber-50 text-amber-700",
        danger: "bg-red-50 text-red-600",
        muted: "bg-muted text-muted-foreground",
      },
      size: {
        xs: "px-1.5 py-0.5 text-[10px] rounded",
        sm: "px-2 py-0.5 text-xs rounded-md",
        md: "px-2.5 py-1 text-xs rounded-lg",
        lg: "px-3 py-1 text-sm rounded-lg",
      },
      pill: {
        true: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
      pill: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, pill, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, pill }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
