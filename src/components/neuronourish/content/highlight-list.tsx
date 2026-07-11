type Tone = "default" | "light" | "on-dark";

const itemTone: Record<Tone, string> = {
  default: "text-ink/75",
  light: "text-sky-blue",
  "on-dark": "text-sky-blue",
};

export function HighlightList({
  items,
  tone = "default",
  size = "sm",
}: {
  items: readonly string[];
  tone?: Tone;
  size?: "sm" | "base";
}) {
  return (
    <ul className="space-y-2">
      {items.map((highlight) => (
        <li
          key={highlight}
          className={`flex items-start ${size === "sm" ? "text-sm" : "text-base"} ${itemTone[tone]}`}
        >
          <span className="mr-2 shrink-0 font-bold text-gold">•</span>
          <span>{highlight}</span>
        </li>
      ))}
    </ul>
  );
}

export function CheckList({
  items,
  className = "",
  tone = "default",
}: {
  items: readonly string[];
  className?: string;
  tone?: "default" | "dark";
}) {
  const textClass = tone === "dark" ? "text-sky-blue" : "text-ink/80";

  return (
    <ul className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <li key={item} className={`flex gap-3 text-sm ${textClass}`}>
          <span className="shrink-0 text-gold">✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
