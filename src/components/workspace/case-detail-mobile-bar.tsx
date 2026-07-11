"use client";

import type { Lead } from "@/generated/prisma/client";
import { leadToCase } from "@/lib/case";
import { CaseCardFooter } from "@/components/workspace/case-card-footer";

type Props = {
  data: Lead;
  onRefresh: () => void;
  hidden?: boolean;
};

export function CaseDetailMobileBar({ data, onRefresh, hidden }: Props) {
  if (hidden) return null;

  const caseItem = leadToCase(data);

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 border-t border-slate-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
      <CaseCardFooter caseItem={caseItem} onRefresh={onRefresh} prominent />
    </div>
  );
}
