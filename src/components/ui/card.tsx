import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Add hover lift effect */
  hoverable?: boolean;
}

function Card({ className, hoverable, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-light bg-background shadow-sm transition-all duration-300",
        hoverable && "hover:shadow-lg hover:scale-[1.02] cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

function CardImage({
  className,
  alt,
  ...props
}: Omit<ImageProps, "alt"> & { alt: string }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-muted">
      <Image
        alt={alt}
        className={cn("object-cover transition-transform duration-500 group-hover:scale-105", className)}
        fill
        {...props}
      />
    </div>
  );
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pb-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center p-4 pt-0", className)}
      {...props}
    />
  );
}

export { Card, CardImage, CardContent, CardHeader, CardFooter };
