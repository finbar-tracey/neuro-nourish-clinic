"use client";

import Link from "next/link";
import { Download, LogOut, X } from "lucide-react";
import {
  mobileTabHrefsForVertical,
  shellNavSectionsForVertical,
  type ShellNavItem,
} from "@/components/workspace/shell-nav";
import { cn } from "@/lib/utils";

type NavCounts = Record<string, number>;

type WorkspaceMoreSheetProps = {
  open: boolean;
  onClose: () => void;
  counts: NavCounts;
  pathname: string;
  onLogout: () => void;
};

function isActive(pathname: string, href: string) {
  if (href === "/workspace") return pathname === "/workspace";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MoreNavLink({
  item,
  pathname,
  counts,
  onNavigate,
}: {
  item: ShellNavItem;
  pathname: string;
  counts: NavCounts;
  onNavigate: () => void;
}) {
  const active = isActive(pathname, item.href);
  const count = item.countKey && item.showBadge ? (counts[item.countKey] ?? 0) : 0;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition",
        active ? "bg-navy/10 text-navy" : "text-slate-700 hover:bg-slate-100",
      )}
    >
      <span>{item.label}</span>
      {count > 0 && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums text-white",
            item.countKey === "atRisk" ? "animate-pulse bg-red-500" : "bg-red-500",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export function WorkspaceMoreSheet({ open, onClose, counts, pathname, onLogout }: WorkspaceMoreSheetProps) {
  if (!open) return null;

  const mobileTabSet = new Set<string>(mobileTabHrefsForVertical());
  const navSections = shellNavSectionsForVertical();

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="More workspace destinations"
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <h2 className="text-sm font-semibold text-navy">More</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-4 pb-8">
          {navSections.map((section) => {
            const items = section.items.filter((item) => !mobileTabSet.has(item.href));
            if (items.length === 0) return null;

            return (
              <section key={section.id}>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <MoreNavLink
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      counts={counts}
                      onNavigate={onClose}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          <section>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Data & account
            </p>
            <div className="space-y-1">
              <a
                href="/api/leads/export"
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </a>
              <a
                href="/api/workspace/backup"
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                Full backup
              </a>
              <Link
                href="/"
                onClick={onClose}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                ← View landing page
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
