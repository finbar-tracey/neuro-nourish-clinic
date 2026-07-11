/** Studio portrait with intentional black backdrop — do not remask; circle crop stays clean. */
export const EMER_PORTRAIT_SRC = "/brand/emer-sexton-portrait.jpg";
/** Cache-bust when portrait assets are regenerated. */
export const EMER_PORTRAIT_VERSION = "7";

type PortraitProps = {
  className?: string;
  priority?: boolean;
  variant?: "light" | "dark";
};

export function FounderPortrait({
  className = "",
  priority = false,
  variant = "light",
}: PortraitProps) {
  const src = `${EMER_PORTRAIT_SRC}?v=${EMER_PORTRAIT_VERSION}`;
  const frameClass =
    variant === "dark"
      ? "bg-black shadow-[0_16px_48px_rgba(0,0,0,0.45)] ring-[3px] ring-white/90"
      : "bg-black shadow-[0_12px_40px_rgba(26,51,72,0.18)] ring-2 ring-linen";

  return (
    <div className={`flex justify-center lg:justify-start ${className}`}>
      <div className="w-[min(100%,15rem)] sm:w-[17rem] lg:w-[19rem] xl:w-[21rem]">
        <div className={`aspect-square overflow-hidden rounded-full ${frameClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset; avoid next/image optimizer cache issues on Vercel */}
          <img
            src={src}
            alt="Emer Sexton, Founder of NeuroNourish Clinic"
            width={1080}
            height={1080}
            className="h-full w-full object-cover object-[center_12%]"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}

export function FounderPortraitPlaceholder(props: PortraitProps) {
  return <FounderPortrait {...props} />;
}
