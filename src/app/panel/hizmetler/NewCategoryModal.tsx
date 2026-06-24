"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { createCategoryAction } from "./actions";

const COLOR_OPTIONS = ["#7C3AED", "#EC4899", "#3B82F6", "#F59E0B", "#10B981"];

export function NewCategoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    if (!open) return;
    setName("");
    setColor(COLOR_OPTIONS[0]);
    setError(null);
  }, [open]);

  if (!open) return null;

  function handleSubmit() {
    setError(null);
    if (!name.trim()) {
      setError("Kategori adı zorunludur.");
      return;
    }
    startSubmit(async () => {
      try {
        await createCategoryAction(name, color);
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kategori oluşturulamadı.");
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Yeni Kategori" description="Hizmetleri gruplamak için kategori ekle" size="sm">
      <div className="space-y-4">
        <div>
          <Label>Kategori Adı</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cilt Bakımı" />
        </div>
        <div>
          <Label>Renk</Label>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={cn(
                  "h-8 w-8 rounded-full ring-offset-2 transition-shadow",
                  color === c ? "ring-2 ring-navy-900" : "ring-1 ring-navy-200"
                )}
              />
            ))}
          </div>
        </div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            Kategoriyi Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
