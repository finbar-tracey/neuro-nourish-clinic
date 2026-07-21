import { isCnsVsLive, cnsVsConfigured } from "@/lib/cnsvitalsigns";
import { isNeuronourish } from "@/lib/vertical-config";

/**
 * Ops-only banner. Hidden on public marketing by default (Screaming Frog / UX).
 * Set NN_SHOW_OPS_BANNER=true to surface CNS readiness on staging.
 */
export function CnsLiveOpsBanner() {
  if (!isNeuronourish()) return null;
  if (process.env.NN_SHOW_OPS_BANNER !== "true") return null;
  if (isCnsVsLive() && cnsVsConfigured()) return null;

  const reason = !isCnsVsLive()
    ? "CNSVS_LIVE is off — paid assessments will not auto-issue remote tests."
    : "CNSVS credentials incomplete — paid assessments cannot auto-issue yet.";

  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950 sm:px-6"
    >
      <span className="font-semibold">Ops:</span> {reason} Payment and CRM still work.
    </div>
  );
}
