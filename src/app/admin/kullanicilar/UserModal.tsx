"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { createUserAction } from "./actions";
import type { UserRole } from "@/lib/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "OWNER", label: "İşletme Sahibi" },
  { value: "SUPER_ADMIN", label: "Süper Admin" },
];

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  role: "OWNER" as UserRole,
  businessId: "",
};

export function UserModal({
  open,
  onClose,
  businesses,
}: {
  open: boolean;
  onClose: () => void;
  businesses: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY_FORM, businessId: businesses[0]?.id ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const isBusinessUser = form.role !== "SUPER_ADMIN";

  if (!open) return null;

  function handleClose() {
    setForm({ ...EMPTY_FORM, businessId: businesses[0]?.id ?? "" });
    setError(null);
    onClose();
  }

  function handleSubmit() {
    setError(null);
    if (!form.fullName.trim()) {
      setError("Ad soyad zorunludur.");
      return;
    }
    if (!form.email.trim()) {
      setError("E-posta zorunludur.");
      return;
    }
    if (form.password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (isBusinessUser && !form.businessId) {
      setError("İşletme kullanıcıları için bir işletme seçilmelidir.");
      return;
    }

    startSubmit(async () => {
      try {
        await createUserAction(form);
        router.refresh();
        handleClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kullanıcı oluşturulamadı.");
      }
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title="Yeni Kullanıcı Oluştur" size="lg">
      <div className="space-y-4">
        <div>
          <Label>Ad Soyad</Label>
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>E-posta</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Telefon</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Opsiyonel" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Geçici Şifre</Label>
            <Input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="En az 6 karakter"
            />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {isBusinessUser && (
          <div>
            <Label>İşletme</Label>
            <Select value={form.businessId} onChange={(e) => setForm({ ...form, businessId: e.target.value })}>
              {businesses.length === 0 && <option value="">Önce bir işletme oluşturun</option>}
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            <p className="mt-1.5 text-xs text-navy-400">
              Kullanıcı oluşturulduğunda seçilen işletmeye bu rolle atanır ve girişte doğrudan o işletmenin paneline yönlendirilir.
            </p>
          </div>
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
          <Button variant="ghost" onClick={handleClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            Kullanıcı Oluştur
          </Button>
        </div>
      </div>
    </Modal>
  );
}
