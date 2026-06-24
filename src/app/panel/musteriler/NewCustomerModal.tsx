"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { createCustomerAction } from "./actions";

export function NewCustomerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [kvkkConsent, setKvkkConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    if (!open) return;
    setFullName("");
    setPhone("");
    setEmail("");
    setBirthDate("");
    setGender("");
    setTagsInput("");
    setKvkkConsent(false);
    setError(null);
  }, [open]);

  if (!open) return null;

  function handleSubmit() {
    setError(null);
    if (!fullName.trim()) {
      setError("Ad Soyad zorunludur.");
      return;
    }

    startSubmit(async () => {
      try {
        await createCustomerAction({
          fullName,
          phone: phone || null,
          email: email || null,
          birthDate: birthDate || null,
          gender: gender || null,
          tags: tagsInput
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
          kvkkConsent,
        });
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Müşteri oluşturulamadı.");
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Yeni Müşteri" description="Manuel müşteri kaydı oluştur" size="md">
      <div className="space-y-4">
        <div>
          <Label>Ad Soyad</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ayşe Yılmaz" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Telefon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XX XXX XX XX" />
          </div>
          <div>
            <Label>E-posta</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ayse@example.com" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Doğum Tarihi</Label>
            <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div>
            <Label>Cinsiyet</Label>
            <Select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Belirtilmemiş</option>
              <option value="female">Kadın</option>
              <option value="male">Erkek</option>
            </Select>
          </div>
        </div>

        <div>
          <Label>Etiketler (virgülle ayırın)</Label>
          <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="vip, yeni" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-navy-100 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-navy-900">KVKK Onayı</p>
            <p className="text-xs text-navy-400">Müşteri açık rıza metnini onayladı mı?</p>
          </div>
          <Switch checked={kvkkConsent} onChange={setKvkkConsent} />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            Müşteriyi Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
