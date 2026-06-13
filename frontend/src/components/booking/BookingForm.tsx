"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Slot } from "@/lib/types";
import { ApiClientError } from "@/lib/api";

interface Props {
  slot: Slot;
  dayLabel: string;
  onBack: () => void;
  onSubmit: (data: { name: string; email: string }) => Promise<void>;
}

export function BookingForm({ slot, dayLabel, onBack, onSubmit }: Props) {
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
    <div className="flex min-h-[320px] flex-col p-6 lg:p-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-[#9ca3af] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <p className="text-sm font-medium text-white">{dayLabel}</p>
      <p className="mt-1 text-sm text-[#9ca3af]">{slot.time}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col gap-4">
        {error && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="booking-name" className="mb-1.5 block text-sm text-[#9ca3af]">
            Your name
          </label>
          <input
            id="booking-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#6b7280] focus:border-[#4a4a4a]"
          />
        </div>

        <div>
          <label htmlFor="booking-email" className="mb-1.5 block text-sm text-[#9ca3af]">
            Email address
          </label>
          <input
            id="booking-email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#6b7280] focus:border-[#4a4a4a]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirming…
            </>
          ) : (
            "Confirm"
          )}
        </button>
      </form>
    </div>
  );
}
