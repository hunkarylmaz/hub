import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-navy-50/40 px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-card">
          <Icon className="h-5 w-5 text-violet-600" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-navy-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
