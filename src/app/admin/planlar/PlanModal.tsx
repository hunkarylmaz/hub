"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import type { Plan } from "@/lib/types";
import { updatePlanAction, createPlanAction } from "./actions";

interface FormState {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  originalMonthlyPrice: string;
  originalYearlyPrice: string;
  maxStaff: string;
  maxBranches: string;
  maxMonthlyAppointments: string;
  hasAccounting: boolean;
  hasAdvancedReports: boolean;
  hasSmsWhatsapp: boolean;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  monthlyPrice: "",
  yearlyPrice: "",
  originalMonthlyPrice: "",
  originalYearlyPrice: "",
  maxStaff: "",
  maxBranches: "",
  maxMonthlyAppointments: "",
  hasAccounting: false,
  hasAdvancedReports: false,
  hasSmsWhatsapp: false,
  isActive: true,
};

function toForm(plan: Plan): FormState {
  return {
    name: plan.name,
    monthlyPrice: String(plan.monthlyPrice),
    yearlyPrice: String(plan.yearlyPrice),
    originalMonthlyPrice: plan.originalMonthlyPrice === null ? "" : String(plan.originalMonthlyPrice),
    originalYearlyPrice: plan.originalYearlyPrice === null ? "" : String(plan.originalYearlyPrice),
    maxStaff: plan.maxStaff === null ? "" : String(plan.maxStaff),
    maxBranches: plan.maxBranches === null ? "" : String(plan.maxBranches),
    maxMonthlyAppointments: plan.maxMonthlyAppointments === null ? "" : String(plan.maxMonthlyAppointments),
    hasAccounting: plan.hasAccounting,
    hasAdvancedReports: plan.hasAdvancedReports,
    hasSmsWhatsapp: plan.hasSmsWhatsapp,
    isActive: plan.isActive,
  };
}

export function PlanModal({ open, onClose, plan }: { open: boolean; onClose: () => void; plan: Plan | null }) {
  const router = useRouter();
  const isCreate = plan === null;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    if (open) {
      setError(null);
      setForm(plan ? toForm(plan) : EMPTY_FORM);
    }
  }, [open, plan]);

  if (!open) return null;

  function handleSubmit() {
    setError(null);
    if (!form.name.trim()) {
      setError("Plan adı zorunludur.");
      return;
    }
    const monthlyPrice = Number(form.monthlyPrice);
    const yearlyPrice = Number(form.yearlyPrice);
    if (Number.isNaN(monthlyPrice) || monthlyPrice < 0 || Number.isNaN(yearlyPrice) || yearlyPrice < 0) {
      setError("Geçerli fiyatlar girin.");
      return;
    }
    const originalMonthlyPrice = form.originalMonthlyPrice === "" ? null : Number(form.originalMonthlyPrice);
    const originalYearlyPrice = form.originalYearlyPrice === "" ? null : Number(form.originalYearlyPrice);
    if (originalMonthlyPrice !== null && (Number.isNaN(originalMonthlyPrice) || originalMonthlyPrice < 0)) {
      setError("Geçerli bir aylık çizik fiyat girin.");
      return;
    }
    if (originalYearlyPrice !== null && (Number.isNaN(originalYearlyPrice) || originalYearlyPrice < 0)) {
      setError("Geçerli bir yıllık çizik fiyat girin.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      monthlyPrice,
      yearlyPrice,
      originalMonthlyPrice,
      originalYearlyPrice,
      maxStaff: form.maxStaff === "" ? null : Number(form.maxStaff),
      maxBranches: form.maxBranches === "" ? null : Number(form.maxBranches),
      maxMonthlyAppointments: form.maxMonthlyAppointments === "" ? null : Number(form.maxMonthlyAppointments),
      hasAccounting: form.hasAccounting,
      hasAdvancedReports: form.hasAdvancedReports,
      hasSmsWhatsapp: form.hasSmsWhatsapp,
      isActive: form.isActive,
    };

    startSubmit(async () => {
      try {
        if (isCreate) {
          await createPlanAction(payload);
        } else if (plan) {
          await updatePlanAction(plan.id, payload);
        }
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Plan kaydedilemedi.");
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isCreate ? "Yeni Plan Oluştur" : "Planı Düzenle"} size="lg">
      <div className="space-y-4">
        <div>
          <Label>Plan Adı</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Aylık Fiyat (TRY)</Label>
            <Input type="number" min={0} step={50} value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })} />
          </div>
          <div>
            <Label>Yıllık Fiyat (TRY)</Label>
            <Input type="number" min={0} step={50} value={form.yearlyPrice} onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })} />
          </div>
          <div>
            <Label>Aylık Çizik Fiyat (TRY)</Label>
            <Input
              type="number"
              min={0}
              step={50}
              placeholder="İndirim yok"
              value={form.originalMonthlyPrice}
              onChange={(e) => setForm({ ...form, originalMonthlyPrice: e.target.value })}
            />
          </div>
          <div>
            <Label>Yıllık Çizik Fiyat (TRY)</Label>
            <Input
              type="number"
              min={0}
              step={50}
              placeholder="İndirim yok"
              value={form.originalYearlyPrice}
              onChange={(e) => setForm({ ...form, originalYearlyPrice: e.target.value })}
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-navy-400">
          Çizik fiyat girilirse, landing sayfada gerçek fiyatın yanında üstü çizili olarak gösterilir.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Maks. Personel</Label>
            <Input type="number" min={0} placeholder="Sınırsız" value={form.maxStaff} onChange={(e) => setForm({ ...form, maxStaff: e.target.value })} />
          </div>
          <div>
            <Label>Maks. Şube</Label>
            <Input type="number" min={0} placeholder="Sınırsız" value={form.maxBranches} onChange={(e) => setForm({ ...form, maxBranches: e.target.value })} />
          </div>
          <div>
            <Label>Maks. Aylık Randevu</Label>
            <Input
              type="number"
              min={0}
              placeholder="Sınırsız"
              value={form.maxMonthlyAppointments}
              onChange={(e) => setForm({ ...form, maxMonthlyAppointments: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-navy-100 p-1">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-medium text-navy-900">Ön Muhasebe</p>
            <Switch checked={form.hasAccounting} onChange={(v) => setForm({ ...form, hasAccounting: v })} />
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-medium text-navy-900">Gelişmiş Raporlar</p>
            <Switch checked={form.hasAdvancedReports} onChange={(v) => setForm({ ...form, hasAdvancedReports: v })} />
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-medium text-navy-900">SMS / WhatsApp Bildirimleri</p>
            <Switch checked={form.hasSmsWhatsapp} onChange={(v) => setForm({ ...form, hasSmsWhatsapp: v })} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-navy-100 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-navy-900">Plan Aktif</p>
            <p className="text-xs text-navy-400">Pasif planlar yeni abonelikler için seçilemez.</p>
          </div>
          <Switch checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            Planı Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
