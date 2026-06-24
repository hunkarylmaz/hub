"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { createBusinessAction } from "./actions";
import { SECTORS } from "@/lib/types";
import type { Plan } from "@/lib/types";

const EMPTY_FORM = {
  name: "",
  sector: SECTORS[0].value as string,
  phone: "",
  email: "",
  city: "",
  ownerFullName: "",
  ownerEmail: "",
  ownerPassword: "",
  planId: "",
  billingCycle: "monthly" as "monthly" | "yearly",
  subscriptionStatus: "trial" as "trial" | "active",
};

export function BusinessModal({ open, onClose, plans }: { open: boolean; onClose: () => void; plans: Plan[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY_FORM, planId: plans[0]?.id ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  if (!open) return null;

  function handleClose() {
    setForm({ ...EMPTY_FORM, planId: plans[0]?.id ?? "" });
    setError(null);
    onClose();
  }

  function handleSubmit() {
    setError(null);
    if (!form.name.trim()) {
      setError("İşletme adı zorunludur.");
      return;
    }
    if (!form.ownerFullName.trim()) {
      setError("İşletme sahibi adı zorunludur.");
      return;
    }
    if (!form.ownerEmail.trim()) {
      setError("İşletme sahibi e-postası zorunludur.");
      return;
    }
    if (form.ownerPassword.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (!form.planId) {
      setError("Plan seçimi zorunludur.");
      return;
    }

    startSubmit(async () => {
      try {
        await createBusinessAction(form);
        router.refresh();
        handleClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "İşletme oluşturulamadı.");
      }
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title="Yeni İşletme Ekle" size="lg">
      <div className="space-y-5">
        <div>
          <Label>İşletme Adı</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Sektör</Label>
            <Select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })}>
              {SECTORS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Şehir</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Opsiyonel" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>İşletme Telefonu</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Opsiyonel" />
          </div>
          <div>
            <Label>İşletme E-postası</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Opsiyonel" />
          </div>
        </div>

        <div className="border-t border-navy-100 pt-4">
          <p className="mb-3 text-sm font-semibold text-navy-900">İşletme Sahibi</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Ad Soyad</Label>
              <Input value={form.ownerFullName} onChange={(e) => setForm({ ...form, ownerFullName: e.target.value })} />
            </div>
            <div>
              <Label>E-posta (giriş)</Label>
              <Input type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
            </div>
          </div>
          <div className="mt-4">
            <Label>Geçici Şifre</Label>
            <Input
              type="text"
              value={form.ownerPassword}
              onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
              placeholder="En az 6 karakter"
            />
          </div>
        </div>

        <div className="border-t border-navy-100 pt-4">
          <p className="mb-3 text-sm font-semibold text-navy-900">Plan &amp; Abonelik</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Plan</Label>
              <Select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Faturalandırma</Label>
              <Select value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value as "monthly" | "yearly" })}>
                <option value="monthly">Aylık</option>
                <option value="yearly">Yıllık</option>
              </Select>
            </div>
            <div>
              <Label>Durum</Label>
              <Select
                value={form.subscriptionStatus}
                onChange={(e) => setForm({ ...form, subscriptionStatus: e.target.value as "trial" | "active" })}
              >
                <option value="trial">Deneme (14 gün)</option>
                <option value="active">Aktif</option>
              </Select>
            </div>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
          <Button variant="ghost" onClick={handleClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            İşletme Oluştur
          </Button>
        </div>
      </div>
    </Modal>
  );
}
