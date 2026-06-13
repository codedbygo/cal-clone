"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onBack: () => void;
  onSubmit: (data: { name: string; email: string }) => Promise<void>;
}

export function BookingForm({ onBack, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim() });
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "SLOT_TAKEN") {
        setError("That time was just taken. Please pick another slot.");
      } else {
        setError(err instanceof Error ? err.message : "Booking failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[320px] flex-col border-t border-gray-200 p-6 lg:border-l lg:border-t-0 lg:p-8">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div>
          <label htmlFor="booking-name" className="mb-1.5 block text-sm text-gray-600">
            Your name <span className="text-gray-900">*</span>
          </label>
          <Input
            id="booking-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
          />
        </div>

        <div>
          <label htmlFor="booking-email" className="mb-1.5 block text-sm text-gray-600">
            Email address <span className="text-gray-900">*</span>
          </label>
          <Input
            id="booking-email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
          />
        </div>

        <div className="mt-auto flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={submitting} className="min-w-[6rem]">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming…
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
