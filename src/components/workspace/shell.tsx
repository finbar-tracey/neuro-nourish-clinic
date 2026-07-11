"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/logo";
import {
  AlertTriangle,
  Archive,
  BarChart3,
  Download,
  FileText,
  Home,
  Inbox,
  Landmark,
  LogOut,
  Mail,
  Menu,
  Phone,
  Settings2,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DemoDataBanner } from "@/components/workspace/demo-data-banner";
import {
  mobileTabHrefsForVertical,
  shellNavSectionsForVertical,
  shellNavItemByHref,
  type NavCountKey,
} from "@/components/workspace/shell-nav";
import { WorkspaceMoreSheet } from "@/components/workspace/workspace-more-sheet";
import { WorkspaceMobileSearch } from "@/components/workspace/workspace-mobile-search";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/workspace": Home,
  "/workspace/inbox": Inbox,
  "/workspace/callbacks": Phone,
  "/workspace/documents": FileText,
  "/workspace/applications": Landmark,
  "/workspace/completions": Trophy,
  "/workspace/closed": Archive,
  "/workspace/re-engagement": Mail,
  "/workspace/at-risk": AlertTriangle,
  "/workspace/sources": BarChart3,
  "/workspace/automations": Settings2,
};

type NavCounts = Record<string, number>;

function NavBadge({ count, alert }: { count: number; alert?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
        alert ? "animate-pulse bg-red-500 text-white ring-2 ring-red-400/50" : "bg-white/15 text-slate-200",
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<NavCounts>({});
  const [countsError, setCountsError] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/nav-counts");
      if (!res.ok) {
        setCountsError(true);
        return;
      }
      const data = (await res.json()) as { counts: NavCounts };
      setCounts(data.counts);
      setCountsError(false);
    } catch {
      setCountsError(true);
    }
  }, []);

  useEffect(() => {
    void loadCounts();
    const refresh = () => void loadCounts();
    window.addEventListener("workspace:refresh", refresh);
    window.addEventListener("workspace:counts-changed", refresh);
    return () => {
      window.removeEventListener("workspace:refresh", refresh);
      window.removeEventListener("workspace:counts-changed", refresh);
    };
  }, [loadCounts]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    window.location.href = "/workspace/login";
  }

  function isActive(href: string) {
    if (href === "/workspace") return pathname === "/workspace";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const navSections = shellNavSectionsForVertical();
  const mobileTabs = mobileTabHrefsForVertical();

  function moreTabActive() {
    if (moreOpen) return true;
    const mobileTabSet = new Set<string>(mobileTabs);
    return !mobileTabSet.has(pathname) && pathname.startsWith("/workspace");
  }

  function mobileTabBadgeCount(countKey: NavCountKey | null, showBadge: boolean) {
    if (!countKey || !showBadge) return 0;
    return counts[countKey] ?? 0;
  }

  const moreHiddenCount = navSections
    .flatMap((s) => s.items)
    .filter((item) => !mobileTabs.includes(item.href))
    .reduce((sum, item) => {
      if (!item.countKey || !item.showBadge) return sum;
      return sum + (counts[item.countKey] ?? 0);
    }, 0);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-navy text-white md:flex">
        <div className="border-b border-white/10 px-6 py-5">
          <BrandLogo variant="compact" theme="dark" href="/workspace" />
          <p className="mt-2 text-xs text-slate-400">Operations workspace</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section, sectionIndex) => (
            <div key={section.id} className={cn(sectionIndex > 0 && "mt-4")}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, countKey, showBadge }) => {
                  const Icon = NAV_ICONS[href] ?? Home;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                        isActive(href)
                          ? "bg-white/10 text-gold"
                          : "text-slate-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {countKey && showBadge && (
                        <NavBadge
                          count={counts[countKey] ?? 0}
                          alert={countKey === "atRisk" && (counts.atRisk ?? 0) > 0}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Data & account
          </p>
          <a
            href="/api/leads/export"
            className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <a
            href="/api/workspace/backup"
            className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <Download className="h-4 w-4" />
            Full backup
          </a>
          <Link href="/" className="mb-2 block px-3 text-xs text-slate-400 hover:text-gold">
            ← View landing page
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-navy text-white pt-[env(safe-area-inset-top,0px)] md:hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            {!pathname.startsWith("/workspace/cases/") && (
              <BrandLogo variant="compact" theme="dark" href="/workspace" className="shrink-0" />
            )}
            <WorkspaceMobileSearch />
            <button
              type="button"
              onClick={logout}
              className="min-h-11 shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          <DemoDataBanner />
          {countsError && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 md:px-8">
              Queue counts could not be loaded.{" "}
              <button type="button" onClick={() => void loadCounts()} className="font-semibold underline">
                Retry
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom,0px)] md:hidden">
        <div className="flex items-stretch justify-around">
          {mobileTabs.map((href) => {
            const item = shellNavItemByHref(href);
            if (!item) return null;
            const Icon = NAV_ICONS[href] ?? Home;
            const active = isActive(href);
            const count = mobileTabBadgeCount(item.countKey, item.showBadge);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium",
                  active ? "text-navy" : "text-slate-500",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-gold-ink")} />
                <span className="truncate">{item.shortLabel}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white",
                      item.countKey === "atRisk" ? "animate-pulse bg-red-500" : "bg-red-500",
                    )}
                  >
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium",
              moreTabActive() ? "text-navy" : "text-slate-500",
            )}
          >
            <Menu className={cn("h-5 w-5", moreTabActive() && "text-gold-ink")} />
            <span className="truncate">More</span>
            {moreHiddenCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {moreHiddenCount > 9 ? "9+" : moreHiddenCount}
              </span>
            )}
          </button>
        </div>
      </nav>
      <WorkspaceMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        counts={counts}
        pathname={pathname}
        onLogout={() => void logout()}
      />
    </div>
  );
}
