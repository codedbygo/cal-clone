"use client";

import type { CustomQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  customQuestions: CustomQuestion[];
  answers: Record<string, string>;
  onChange: (answers: Record<string, string>) => void;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  submitting: boolean;
  error: string | null;
  submitLabel?: string;
  guestName?: string;
  guestEmail?: string;
  onGuestChange?: (name: string, email: string) => void;
  readOnlyGuest?: boolean;
}

export function BookingForm({
  customQuestions,
  answers,
  onChange,
  onBack,
  onSubmit,
  submitting,
  error,
  submitLabel = "Confirm",
  guestName = "",
  guestEmail = "",
  onGuestChange,
  readOnlyGuest = false,
}: Props) {
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit();
  }

  return (
    <div className="flex min-h-[320px] flex-col border-t border-border p-6 lg:border-l lg:border-t-0 lg:p-8">
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-1 flex-col gap-4">
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div>
          <Label htmlFor="booking-name" className="mb-1.5">
            Your name <span className="text-foreground">*</span>
          </Label>
          <Input
            id="booking-name"
            required
            readOnly={readOnlyGuest}
            value={guestName}
            onChange={(e) => onGuestChange?.(e.target.value, guestEmail)}
            placeholder="John Smith"
          />
        </div>

        <div>
          <Label htmlFor="booking-email" className="mb-1.5">
            Email address <span className="text-foreground">*</span>
          </Label>
          <Input
            id="booking-email"
            required
            readOnly={readOnlyGuest}
            type="email"
            value={guestEmail}
            onChange={(e) => onGuestChange?.(guestName, e.target.value)}
            placeholder="john@example.com"
          />
        </div>

        {customQuestions.map((q) => (
          <div key={q.id}>
            <Label htmlFor={`q-${q.id}`} className="mb-1.5">
              {q.label}
              {q.required && <span className="text-foreground"> *</span>}
            </Label>
            {q.type === "textarea" ? (
              <textarea
                id={`q-${q.id}`}
                required={q.required}
                value={answers[q.id] ?? ""}
                onChange={(e) => onChange({ ...answers, [q.id]: e.target.value })}
                rows={3}
                className={cn(
                  "flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                )}
              />
            ) : (
              <Input
                id={`q-${q.id}`}
                required={q.required}
                value={answers[q.id] ?? ""}
                onChange={(e) => onChange({ ...answers, [q.id]: e.target.value })}
              />
            )}
          </div>
        ))}

        <div className="mt-auto flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={submitting} className="min-w-[6rem]">
            {submitting ? "Confirming…" : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
