import { NeuroNourishResourceHints } from "@/components/neuronourish/resource-hints";
import { NN_THIRD_PARTY } from "@/lib/neuronourish-pagespeed";

export default function DiscoveryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="dns-prefetch" href={NN_THIRD_PARTY.calendlyScript} />
      <link rel="preconnect" href={NN_THIRD_PARTY.calendlyScript} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={NN_THIRD_PARTY.calendlyWidget} />
      <link rel="preconnect" href={NN_THIRD_PARTY.calendlyWidget} crossOrigin="anonymous" />
      <NeuroNourishResourceHints />
      {children}
    </>
  );
}
