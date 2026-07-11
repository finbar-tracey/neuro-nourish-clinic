import { HEALTHCARE_PATIENT_COMPLIANCE_STRIP } from "@/lib/healthcare-lp-copy";

export function HealthcarePatientComplianceStrip() {
  return (
    <div className="border-b border-slate-200 bg-brand-cream px-4 py-3 text-center text-xs font-medium leading-relaxed text-slate-600 sm:px-6 sm:text-sm">
      <p className="mx-auto max-w-4xl">{HEALTHCARE_PATIENT_COMPLIANCE_STRIP}</p>
    </div>
  );
}
