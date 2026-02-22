import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  /* base */
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-sm hover:bg-primary-dark",
        secondary:
          "bg-primary-50 text-primary border border-primary-200 hover:bg-primary-100",
        outline:
          "border-2 border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary-50 hover:text-primary",
        ghost:
          "text-foreground hover:bg-muted hover:text-primary",
        accent:
          "bg-accent text-gray-900 font-bold hover:bg-accent-dark",
        danger:
          "bg-error text-white hover:bg-red-600",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        xs: "h-7 rounded-md px-2.5 text-xs",
        sm: "h-8 rounded-lg px-3 text-sm",
        md: "h-10 rounded-lg px-4 text-sm",
        lg: "h-12 rounded-xl px-6 text-base",
        xl: "h-14 rounded-xl px-8 text-lg",
        icon: "h-10 w-10 rounded-full",
        "icon-sm": "h-8 w-8 rounded-full",
        "icon-xs": "h-7 w-7 rounded-full",
      },
      fullWidth: {
        true: "w-full",
      },
      pill: {
        true: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, pill, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth, pill }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
