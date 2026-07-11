"use client";

import { useState } from "react";
import { Check, FileText, Mail, MessageCircle, Phone, PhoneOff, Send, Voicemail } from "lucide-react";
import {
  defaultEmailSubject,
  defaultSmsBody,
  mailtoLink,
  smsLink,
  telLink,
  whatsappLink,
} from "@/lib/contact-actions";
import {
  getCardWorkflow,
  runCardWorkflowAction,
  type CardWorkflowKind,
} from "@/lib/case-workflow";
import type { CaseView } from "@/lib/case";
import { cn } from "@/lib/utils";

type Props = {
  caseItem: CaseView;
  onRefresh?: () => void;
  prominent?: boolean;
};

type ActionBtn = {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  onClick: () => Promise<void>;
  variant: "primary" | "workflow" | "contact" | "whatsapp";
};

async function logContact(
  leadId: string,
  channel: "call" | "sms" | "email" | "whatsapp",
  outcome?: "attempted" | "no_answer" | "connected" | "sent",
  note?: string,
) {
  const res = await fetch(`/api/leads/${leadId}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, outcome, note }),
  });
  if (!res.ok) throw new Error("Contact log failed");
}

export function CaseCardFooter({ caseItem: c, onRefresh, prominent = false }: Props) {
  const kind = getCardWorkflow(c);
  const isLogCall = kind === "log-call";
  const [workflowOpen, setWorkflowOpen] = useState(!isLogCall);
  const [pending, setPending] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(id: string, fn: () => Promise<void>) {
    setPending(id);
    setError(null);
    try {
      await fn();
      setFlash(id);
      onRefresh?.();
      window.setTimeout(() => setFlash(null), 2500);
    } catch {
      setError("Could not save — try again");
    } finally {
      setPending(null);
    }
  }

  function workflowButtons(workflowKind: CardWorkflowKind): ActionBtn[] {
    const id = c.caseId;
    switch (workflowKind) {
      case "log-call":
        return [
          {
            id: "connected",
            label: "Spoke to client",
            shortLabel: "Spoke",
            icon: <Check className="h-3 w-3" />,
            variant: "workflow",
            onClick: async () => {
              await logContact(id, "call", "connected");
            },
          },
          {
            id: "no_answer",
            label: "No answer",
            shortLabel: "No ans",
            icon: <PhoneOff className="h-3 w-3" />,
            variant: "workflow",
            onClick: async () => {
              await logContact(id, "call", "no_answer");
            },
          },
          {
            id: "voicemail",
            label: "Left voicemail",
            shortLabel: "VM",
            icon: <Voicemail className="h-3 w-3" />,
            variant: "workflow",
            onClick: async () => {
              await logContact(id, "call", "no_answer", "Voicemail left");
            },
          },
        ];
      case "consultation":
        return [
          {
            id: "completed",
            label: "Consultation done",
            shortLabel: "Done",
            icon: <Check className="h-3 w-3" />,
            variant: "workflow",
            onClick: async () => {
              await runCardWorkflowAction(id, "consultation", "completed");
            },
          },
          {
            id: "no-show",
            label: "No-show",
            shortLabel: "No-show",
            icon: <PhoneOff className="h-3 w-3" />,
            variant: "workflow",
            onClick: async () => {
              await runCardWorkflowAction(id, "consultation", "no-show");
            },
          },
        ];
      case "request-documents":
        return [
          {
            id: "send",
            label: "Send doc checklist",
            shortLabel: "Send docs",
            icon: <Send className="h-3 w-3" />,
            variant: "workflow",
            onClick: async () => {
              await runCardWorkflowAction(id, "request-documents", "send");
            },
          },
        ];
      case "chase-documents":
        return [
          {
            id: "chase",
            label: "Chase sent",
            shortLabel: "Chase",
            icon: <Send className="h-3 w-3" />,
            variant: "workflow",
            onClick: async () => {
              await runCardWorkflowAction(id, "chase-documents", "chase");
            },
          },
          {
            id: "received",
            label: "Docs received",
            shortLabel: "Received",
            icon: <FileText className="h-3 w-3" />,
            variant: "workflow",
            onClick: async () => {
              await runCardWorkflowAction(id, "chase-documents", "received");
            },
          },
        ];
    }
  }

  const contactButtons: ActionBtn[] = [
    {
      id: "call",
      label: "Call",
      shortLabel: "Call",
      icon: <Phone className="h-3 w-3" />,
      variant: "contact",
      onClick: async () => {
        await logContact(c.caseId, "call", "attempted");
        setWorkflowOpen(true);
        window.location.href = telLink(c.phone);
      },
    },
    {
      id: "sms",
      label: "SMS",
      shortLabel: "SMS",
      icon: <MessageCircle className="h-3 w-3" />,
      variant: "contact",
      onClick: async () => {
        await logContact(c.caseId, "sms", "sent");
        window.location.href = smsLink(c.phone, defaultSmsBody(c.borrowerFirstName));
      },
    },
    {
      id: "email",
      label: "Email",
      shortLabel: "Mail",
      icon: <Mail className="h-3 w-3" />,
      variant: "contact",
      onClick: async () => {
        await logContact(c.caseId, "email", "sent");
        window.location.href = mailtoLink(c.email, defaultEmailSubject(c.borrowerFirstName));
      },
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      shortLabel: "WA",
      icon: <MessageCircle className="h-3 w-3" />,
      variant: "whatsapp",
      onClick: async () => {
        await logContact(c.caseId, "whatsapp", "sent");
        window.open(
          whatsappLink(c.phone, defaultSmsBody(c.borrowerFirstName)),
          "_blank",
          "noopener,noreferrer",
        );
      },
    },
  ];

  const workflow = kind && workflowOpen ? workflowButtons(kind) : [];
  const allButtons = [...workflow, ...contactButtons];

  const btnClass = prominent
    ? "inline-flex h-11 min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50"
    : "inline-flex h-7 items-center justify-center gap-1 rounded-md px-2 text-[10px] font-semibold transition active:scale-[0.98] disabled:opacity-50";

  return (
    <div className="relative z-20 border-t border-slate-100 bg-slate-50/60 px-2 py-1.5 sm:px-2.5">
      {isLogCall && !workflowOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setWorkflowOpen(true);
          }}
          className="mb-1 text-[10px] font-medium text-slate-500 hover:text-navy"
        >
          Log call outcome →
        </button>
      )}
      <div
        className={cn(
          "grid gap-1",
          prominent
            ? "grid-cols-3"
            : allButtons.length <= 4
              ? "grid-cols-4"
              : "grid-cols-4 sm:grid-cols-7",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {allButtons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            disabled={pending != null}
            title={btn.label}
            aria-label={btn.label}
            onClick={() => void run(btn.id, btn.onClick)}
            className={cn(
              btnClass,
              flash === btn.id && "ring-2 ring-emerald-400",
              btn.variant === "contact" && "bg-navy text-white hover:bg-navy-light",
              btn.variant === "workflow" &&
                "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              btn.variant === "whatsapp" &&
                "border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50",
              btn.variant === "primary" && "bg-emerald-600 text-white",
            )}
          >
            {btn.icon}
            <span className={prominent ? "inline" : "hidden min-[400px]:inline"}>{btn.shortLabel}</span>
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-1 text-[10px] font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
