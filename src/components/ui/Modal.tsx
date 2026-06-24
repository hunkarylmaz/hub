"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative w-full rounded-2xl bg-white shadow-elevated max-h-[90vh] overflow-y-auto panel-scrollbar", sizeClasses)}>
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 border-b border-navy-100 px-6 py-5">
            <div>
              {title && <h2 className="text-lg font-semibold text-navy-900">{title}</h2>}
              {description && <p className="mt-1 text-sm text-navy-500">{description}</p>}
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {!title && !description && (
          <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700">
            <X className="h-5 w-5" />
          </button>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
