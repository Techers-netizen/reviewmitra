import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  size = 14,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const colorClass =
    rating >= 4 ? "star-green" : rating === 3 ? "star-amber" : "star-red";
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            "transition-colors",
            i < rating ? colorClass : "text-muted-foreground/40"
          )}
          fill={i < rating ? "currentColor" : "none"}
          strokeWidth={i < rating ? 0 : 2}
        />
      ))}
    </div>
  );
}
