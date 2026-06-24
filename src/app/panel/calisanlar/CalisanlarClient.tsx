"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Phone, Mail, Globe2, UserSquare2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Switch } from "@/components/ui/Switch";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Service, Staff } from "@/lib/types";
import { toggleStaffActiveAction } from "./actions";
import { NewStaffModal } from "./NewStaffModal";
import { StaffDetailModal } from "./StaffDetailModal";

export function CalisanlarClient({
  staff,
  services,
  staffServiceMap,
}: {
  staff: Staff[];
  services: Service[];
  staffServiceMap: Record<string, string[]>;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [, startToggle] = useTransition();

  function handleToggleActive(member: Staff, isActive: boolean) {
    startToggle(async () => {
      await toggleStaffActiveAction(member.id, isActive);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> Yeni Çalışan
        </Button>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          icon={UserSquare2}
          title="Henüz çalışan yok"
          description="Ekibini ekleyerek randevuları çalışanlara atayabilirsin."
          action={
            <Button onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" /> Yeni Çalışan
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => {
            const serviceCount = staffServiceMap[member.id]?.length ?? 0;
            return (
              <div
                key={member.id}
                className="rounded-2xl border border-navy-100 bg-white p-4 shadow-card transition-shadow hover:shadow-elevated"
              >
                <button type="button" onClick={() => setSelectedId(member.id)} className="flex w-full items-start gap-3 text-left">
                  <Avatar name={member.fullName} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy-900">{member.fullName}</p>
                    {member.title && <p className="truncate text-sm text-navy-500">{member.title}</p>}
                    <div className="mt-2 space-y-1 text-xs text-navy-400">
                      {member.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" /> {member.phone}
                        </p>
                      )}
                      {member.email && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3" /> {member.email}
                        </p>
                      )}
                      <p className="flex items-center gap-1.5">
                        <Globe2 className="h-3 w-3" /> {serviceCount} hizmet verebiliyor
                      </p>
                    </div>
                  </div>
                </button>
                <div className="mt-3 flex items-center justify-between border-t border-navy-50 pt-3">
                  <span className="text-xs text-navy-400">{member.isActive ? "Aktif" : "Pasif"}</span>
                  <Switch checked={member.isActive} onChange={(v) => handleToggleActive(member, v)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <StaffDetailModal
        staffId={selectedId}
        services={services}
        onClose={() => setSelectedId(null)}
      />
      <NewStaffModal open={showNew} onClose={() => setShowNew(false)} />
    </div>
  );
}
