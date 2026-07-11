import { NN_FUNNEL_TRUST } from "@/lib/neuronourish-copy";

export function FunnelTrustBar({ className = "" }: { className?: string }) {
  return (
    <ul
      className={`flex flex-wrap justify-center gap-2 ${className}`}
      aria-label="Clinical trust indicators"
    >
      {NN_FUNNEL_TRUST.map((item) => (
        <li
          key={item}
          className="rounded-full border border-mist/80 bg-white/70 px-3 py-1 text-[11px] text-ink/70"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
