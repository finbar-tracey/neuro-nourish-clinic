"use client";

import { useState } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import {
  defaultEmailSubject,
  defaultSmsBody,
  mailtoLink,
  smsLink,
  telLink,
  whatsappLink,
} from "@/lib/contact-actions";
import { cn } from "@/lib/utils";

type Props = {
  leadId: string;
  firstName: string;
  phone: string;
  email: string;
  compact?: boolean;
  /** Icon toolbar for CaseCard — single horizontal row */
  dense?: boolean;
  onLogged?: () => void;
};

async function logContact(
  leadId: string,
  channel: "call" | "sms" | "email" | "whatsapp",
  outcome?: "attempted" | "no_answer" | "connected" | "sent",
) {
  const res = await fetch(`/api/leads/${leadId}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, outcome }),
  });
  if (!res.ok) throw new Error("Contact log failed");
}

export function LeadContactActions({
  leadId,
  firstName,
  phone,
  email,
  compact = false,
  dense = false,
  onLogged,
}: Props) {
  const [pending, setPending] = useState<string | null>(null);

  async function runAction(key: string, fn: () => Promise<void>) {
    setPending(key);
    try {
      await fn();
      onLogged?.();
    } finally {
      setPending(null);
    }
  }

  async function handleCall() {
    await logContact(leadId, "call", "attempted");
    onLogged?.();
    window.location.href = telLink(phone);
  }

  async function handleSms() {
    await logContact(leadId, "sms", "sent");
    onLogged?.();
    window.location.href = smsLink(phone, defaultSmsBody(firstName));
  }

  async function handleEmail() {
    await logContact(leadId, "email", "sent");
    onLogged?.();
    window.location.href = mailtoLink(email, defaultEmailSubject(firstName));
  }

  async function handleWhatsApp() {
    await logContact(leadId, "whatsapp", "sent");
    onLogged?.();
    window.open(whatsappLink(phone, defaultSmsBody(firstName)), "_blank", "noopener,noreferrer");
  }

  const btnClass = dense
    ? "inline-flex h-7 min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1.5 text-[10px] font-semibold transition active:scale-[0.98] sm:flex-initial sm:px-2"
    : compact
      ? "inline-flex min-h-[36px] w-full items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition active:scale-[0.98]"
      : "inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition active:scale-[0.98] sm:text-sm";

  const iconSize = dense ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div
      className={cn(
        dense ? "grid grid-cols-4 gap-1" : cn("grid grid-cols-2 gap-1.5", compact && "sm:grid-cols-4"),
      )}
    >
      <button
        type="button"
        disabled={pending != null}
        onClick={(e) => {
          e.stopPropagation();
          void runAction("call", handleCall);
        }}
        className={cn(btnClass, "bg-navy text-white hover:bg-navy-light")}
        title="Call"
      >
        <Phone className={iconSize} />
        {pending === "call" ? "…" : "Call"}
      </button>
      <button
        type="button"
        disabled={pending != null}
        onClick={(e) => {
          e.stopPropagation();
          void runAction("sms", handleSms);
        }}
        className={cn(btnClass, "border border-slate-200 bg-white text-navy hover:bg-slate-50")}
        title="SMS"
      >
        <MessageCircle className={iconSize} />
        SMS
      </button>
      <button
        type="button"
        disabled={pending != null}
        onClick={(e) => {
          e.stopPropagation();
          void runAction("email", handleEmail);
        }}
        className={cn(btnClass, "border border-slate-200 bg-white text-navy hover:bg-slate-50")}
        title="Email"
      >
        <Mail className={iconSize} />
        <span className={dense ? "hidden sm:inline" : undefined}>Email</span>
        {dense && <span className="sm:hidden">Mail</span>}
      </button>
      <button
        type="button"
        disabled={pending != null}
        onClick={(e) => {
          e.stopPropagation();
          void runAction("whatsapp", handleWhatsApp);
        }}
        className={cn(
          btnClass,
          "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
        )}
        title="WhatsApp"
      >
        WA
      </button>
    </div>
  );
}
