import { isNeuronourish } from "@/lib/vertical-config";
import { NN_THIRD_PARTY } from "@/lib/neuronourish-pagespeed";

/** Route-scoped resource hints for NeuroNourish marketing pages. */
export function NeuroNourishResourceHints() {
  if (!isNeuronourish()) return null;

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {pixelId ? (
        <>
          <link rel="dns-prefetch" href={NN_THIRD_PARTY.metaPixel} />
          <link rel="preconnect" href={NN_THIRD_PARTY.metaPixel} crossOrigin="anonymous" />
        </>
      ) : null}
    </>
  );
}
