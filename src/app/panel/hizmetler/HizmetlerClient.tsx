"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Clock, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrencyTRY } from "@/lib/utils";
import type { Service, ServiceCategory, Staff } from "@/lib/types";
import { toggleServiceActiveAction } from "./actions";
import { ServiceModal } from "./ServiceModal";
import { NewCategoryModal } from "./NewCategoryModal";

export function HizmetlerClient({
  categories,
  services,
  staff,
  serviceStaffMap,
}: {
  categories: ServiceCategory[];
  services: Service[];
  staff: Staff[];
  serviceStaffMap: Record<string, string[]>;
}) {
  const router = useRouter();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [, startToggle] = useTransition();

  const groups = useMemo(() => {
    const byCategory = new Map<string, Service[]>();
    for (const service of services) {
      const key = service.categoryId ?? "__none";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(service);
    }
    const result: { category: ServiceCategory | null; services: Service[] }[] = [];
    for (const category of categories) {
      if (byCategory.has(category.id)) {
        result.push({ category, services: byCategory.get(category.id)! });
      }
    }
    if (byCategory.has("__none")) {
      result.push({ category: null, services: byCategory.get("__none")! });
    }
    return result;
  }, [categories, services]);

  function handleToggleActive(service: Service, isActive: boolean) {
    startToggle(async () => {
      await toggleServiceActiveAction(service.id, isActive);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={() => setShowNewCategory(true)}>
          <Plus className="h-4 w-4" /> Yeni Kategori
        </Button>
        <Button
          onClick={() => {
            setEditingService(null);
            setShowServiceModal(true);
          }}
        >
          <Plus className="h-4 w-4" /> Yeni Hizmet
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Henüz hizmet yok"
          description="İlk hizmetini ekleyerek randevu almaya başlayabilirsin."
          action={
            <Button
              onClick={() => {
                setEditingService(null);
                setShowServiceModal(true);
              }}
            >
              <Plus className="h-4 w-4" /> Yeni Hizmet
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.category?.id ?? "none"}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: group.category?.color ?? "#94A3B8" }}
                />
                <h3 className="text-sm font-semibold text-navy-900">{group.category?.name ?? "Kategorisiz"}</h3>
                <span className="text-xs text-navy-400">({group.services.length})</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
                {group.services.map((service, idx) => {
                  const staffCount = serviceStaffMap[service.id]?.length ?? 0;
                  return (
                    <div
                      key={service.id}
                      className={`flex items-center justify-between gap-4 px-4 py-3 ${idx > 0 ? "border-t border-navy-50" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditingService(service);
                          setShowServiceModal(true);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: service.color }} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-navy-900">{service.name}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-navy-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {service.durationMinutes} dk
                              {service.bufferMinutes > 0 ? ` (+${service.bufferMinutes} dk tampon)` : ""}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {staffCount} çalışan
                            </span>
                            {!service.isOnlineBookable && <span>Sadece panelden</span>}
                            {service.requiresDeposit && <span>Kapora gerekli</span>}
                          </div>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-4">
                        <span className="font-medium text-navy-900">{formatCurrencyTRY(service.price)}</span>
                        <Switch checked={service.isActive} onChange={(v) => handleToggleActive(service, v)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceModal
        open={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        service={editingService}
        categories={categories}
        staff={staff}
        assignedStaffIds={editingService ? serviceStaffMap[editingService.id] ?? [] : []}
      />
      <NewCategoryModal open={showNewCategory} onClose={() => setShowNewCategory(false)} />
    </div>
  );
}
