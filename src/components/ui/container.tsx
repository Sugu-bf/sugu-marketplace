import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use a narrower max-width */
  narrow?: boolean;
  as?: "div" | "section" | "article" | "main";
}

/**
 * Responsive container with consistent padding and max-width.
 */
function Container({
  className,
  narrow,
  as: Tag = "div",
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto px-4 lg:px-8",
        narrow ? "max-w-[960px]" : "max-w-[1400px]",
        className
      )}
      {...props}
    />
  );
}

export { Container };
