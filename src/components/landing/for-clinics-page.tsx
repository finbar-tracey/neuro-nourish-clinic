import { MetaViewContent } from "@/components/analytics/meta-pixel";
import { ForClinicsComparison } from "@/components/landing/for-clinics-comparison";
import { ForClinicsComplianceStrip } from "@/components/landing/for-clinics-compliance-strip";
import { ForClinicsCrmSection } from "@/components/landing/for-clinics-crm-section";
import { ForClinicsFaq } from "@/components/landing/for-clinics-faq";
import { ForClinicsFooter } from "@/components/landing/for-clinics-footer";
import { ForClinicsGuarantee } from "@/components/landing/for-clinics-guarantee";
import { ForClinicsHeader } from "@/components/landing/for-clinics-header";
import { ForClinicsHero } from "@/components/landing/for-clinics-hero";
import { ForClinicsHowItWorks } from "@/components/landing/for-clinics-how-it-works";
import { ForClinicsMidCta } from "@/components/landing/for-clinics-mid-cta";
import { ForClinicsOperator } from "@/components/landing/for-clinics-operator";
import { ForClinicsPilotOffer } from "@/components/landing/for-clinics-pilot-offer";
import { ForClinicsProblem } from "@/components/landing/for-clinics-problem";
import { ForClinicsProof } from "@/components/landing/for-clinics-proof";
import { ForClinicsStickyCta } from "@/components/landing/for-clinics-sticky-cta";

export function ForClinicsPage() {
  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <MetaViewContent contentName="For Clinics — B2B" />
      <ForClinicsHeader />
      <main id="main-content">
        <ForClinicsHero />
        <ForClinicsComplianceStrip />
        <ForClinicsProof />
        <ForClinicsProblem />
        <ForClinicsComparison />
        <ForClinicsCrmSection />
        <ForClinicsMidCta />
        <ForClinicsPilotOffer />
        <ForClinicsHowItWorks />
        <ForClinicsGuarantee />
        <ForClinicsOperator />
        <ForClinicsFaq />
      </main>
      <ForClinicsFooter />
      <ForClinicsStickyCta />
    </div>
  );
}
