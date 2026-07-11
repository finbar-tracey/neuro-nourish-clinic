import { Suspense } from "react";
import { ProgrammeContent } from "@/components/neuronourish/programme-content";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";
import { runtimeSecret } from "@/lib/runtime-env";

export const metadata = buildNeuronourishMetadata("programme");

export default function ProgrammePage() {
  const checkoutAvailable = Boolean(runtimeSecret("STRIPE_SECRET_KEY"));

  return (
    <Suspense
      fallback={
        <p className="py-20 text-center text-sm text-ink/60">Loading programme…</p>
      }
    >
      <ProgrammeContent checkoutAvailable={checkoutAvailable} />
    </Suspense>
  );
}
