import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" }[size];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-violet-gradient font-semibold text-white",
        sizeClasses,
        className
      )}
    >
      {initials(name) || "?"}
    </div>
  );
}
