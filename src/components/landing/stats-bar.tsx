import { Building2, Clock, Globe, TrendingUp } from "lucide-react";

const STATS = [
  { icon: TrendingUp, value: "15+", label: "Years' experience" },
  { icon: Building2, value: "£500M+", label: "Finance arranged" },
  { icon: Globe, value: "200+", label: "Trusted lenders" },
  { icon: Clock, value: "10+", label: "Countries served" },
];

export function StatsBar() {
  return (
    <section className="border-b border-slate-200 bg-white py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
        {STATS.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex flex-col items-center text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
              <Icon className="h-5 w-5 text-gold" />
            </div>
            <p className="font-display text-2xl font-medium text-navy">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
