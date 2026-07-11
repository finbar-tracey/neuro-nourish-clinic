"use client";

import { ExpressionOfInterestForm } from "@/components/forms/expression-of-interest-form";
import { NN_DISCOVERY } from "@/lib/neuronourish-copy";

export function DiscoveryRequestForm({
  leadId,
  compactIntro = false,
}: {
  leadId?: string;
  compactIntro?: boolean;
}) {
  return (
    <div className="text-left">
      {!compactIntro ? (
        <p className="mb-4 text-center text-sm text-ink/70">{NN_DISCOVERY.formIntro}</p>
      ) : null}
      <ExpressionOfInterestForm
        intent="discovery"
        submitLabel={NN_DISCOVERY.formSubmit}
        leadId={leadId}
      />
    </div>
  );
}
