import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/types";
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_HEX } from "@/lib/types";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("status-badge bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100", className)}
      {...props}
    />
  );
}

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  return <span className={cn("status-badge", APPOINTMENT_STATUS_COLORS[status], className)}>{APPOINTMENT_STATUS_LABELS[status]}</span>;
}

export function StatusDot({ status, className }: { status: AppointmentStatus; className?: string }) {
  return <span className={cn("inline-block h-2 w-2 shrink-0 rounded-full", className)} style={{ backgroundColor: APPOINTMENT_STATUS_HEX[status] }} />;
}
