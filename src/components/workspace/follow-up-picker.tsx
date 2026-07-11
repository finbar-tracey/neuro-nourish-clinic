"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { FollowUpPreset } from "@/lib/follow-up-schedule";

type FollowUpPickerProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: { followUpPreset: FollowUpPreset; followUpAt?: string }) => void;
  saving?: boolean;
  title?: string;
  description?: string;
};

const PRESETS: Array<{ id: FollowUpPreset; label: string }> = [
  { id: "today", label: "Today" },
  { id: "1d", label: "1 day" },
  { id: "2d", label: "2 days" },
  { id: "3d", label: "3 days" },
];

export function FollowUpPicker({
  open,
  onClose,
  onConfirm,
  saving,
  title = "When should you follow up?",
  description = "The lead moves to Follow-Up with your chosen date.",
}: FollowUpPickerProps) {
  const [customDate, setCustomDate] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  if (!open) return null;

  function confirmCustom() {
    if (!customDate) return;
    onConfirm({ followUpPreset: "custom", followUpAt: new Date(customDate).toISOString() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
        role="dialog"
        aria-labelledby="follow-up-title"
      >
        <h3 id="follow-up-title" className="text-lg font-semibold text-navy">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>

        {!showCustom ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {PRESETS.map(({ id, label }) => (
              <Button
                key={id}
                variant="secondary"
                className="min-h-[44px]"
                disabled={saving}
                onClick={() => onConfirm({ followUpPreset: id })}
              >
                {label}
              </Button>
            ))}
            <Button
              variant="outline"
              className="col-span-2 min-h-[44px]"
              disabled={saving}
              onClick={() => setShowCustom(true)}
            >
              Pick date…
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <input
              type="datetime-local"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCustom(false)}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!customDate || saving}
                onClick={confirmCustom}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}

        {!showCustom && (
          <Button variant="ghost" className="mt-3 w-full" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
