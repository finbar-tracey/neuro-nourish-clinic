import { NeuroNourishMark } from "@/components/brand/neuronourish-mark";
import { NeuroNourishHeaderNavDesktop } from "@/components/neuronourish/header-nav-desktop";
import { NeuroNourishHeaderNavMobile } from "@/components/neuronourish/header-nav-mobile";

export function NeuroNourishHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-deep-slate pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <NeuroNourishMark theme="dark" />
        <div className="flex flex-1 items-center justify-end gap-4 lg:gap-6">
          <NeuroNourishHeaderNavDesktop />
          <NeuroNourishHeaderNavMobile />
        </div>
      </div>
    </header>
  );
}
