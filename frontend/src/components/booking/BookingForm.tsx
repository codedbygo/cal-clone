"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ApiClientError } from "@/lib/api";

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
    <div className="flex min-h-[320px] flex-col border-t border-[#2a2a2a] p-6 lg:border-l lg:border-t-0 lg:p-8">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        {error && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="booking-name" className="mb-1.5 block text-sm text-[#9ca3af]">
            Your name <span className="text-white">*</span>
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
            Email address <span className="text-white">*</span>
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

        <div className="mt-auto flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-2 text-sm text-[#9ca3af] hover:text-white"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-w-[6rem] items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50"
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
        </div>
      </form>
    </div>
  );
}
