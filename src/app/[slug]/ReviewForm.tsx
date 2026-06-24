"use client";

import { useState } from "react";
import { Loader2, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { createPublicReviewAction } from "./actions";

export function ReviewForm({ slug }: { slug: string }) {
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customerName.trim()) {
      setError("Ad Soyad zorunludur.");
      return;
    }
    if (rating < 1) {
      setError("Lütfen bir puan seçin.");
      return;
    }
    setSubmitting(true);
    try {
      await createPublicReviewAction({ slug, customerName, rating, comment: comment || null });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Değerlendirme gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-navy-200 bg-navy-50/40 px-4 py-8 text-center">
        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        <p className="text-sm font-medium text-navy-700">Değerlendirmeniz için teşekkürler!</p>
        <p className="text-xs text-navy-500">Yorumunuz onaylandıktan sonra burada görünecek.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Puanınız</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5"
              aria-label={`${value} yıldız`}
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  (hoverRating || rating) >= value ? "fill-amber-400 text-amber-400" : "text-navy-200"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="review-name">Ad Soyad</Label>
        <Input
          id="review-name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Adınız Soyadınız"
          maxLength={120}
        />
      </div>

      <div>
        <Label htmlFor="review-comment">Yorumunuz (opsiyonel)</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Deneyiminizi paylaşın..."
          rows={3}
          maxLength={500}
        />
      </div>

      <FieldError>{error}</FieldError>

      <Button type="submit" loading={submitting} className="w-full sm:w-auto">
        Değerlendirmeyi Gönder
      </Button>
    </form>
  );
}
