import { runtimeEnv, runtimeSecret } from "@/lib/runtime-env";
import { siteUrl } from "@/lib/site-url";

export interface CNSAssessmentResponse {
  success: boolean;
  testUrl?: string;
  patientId: string;
  error?: string;
}

function cnsFallbackTestUrl(patientId: string): string {
  const configured = runtimeEnv("CNS_VITAL_SIGNS_TEST_URL");
  if (configured) {
    const separator = configured.includes("?") ? "&" : "?";
    return `${configured}${separator}ref=${encodeURIComponent(patientId)}`;
  }
  return `https://cnsvitalsigns.com?ref=${encodeURIComponent(patientId)}`;
}

function cnsApiEndpoint(): string {
  const configured = runtimeEnv("CNS_VITAL_SIGNS_API_URL");
  if (configured) return configured;
  return "https://cnsvitalsigns.com/api/patients";
}

function isPlaceholderKey(apiKey: string): boolean {
  return apiKey.startsWith("cns_placeholder") || apiKey === "cns_live_xxxxxxxxxxxxxxxxxxxxxxxx";
}

/** Registers a patient assessment session in the CNS Vital Signs cluster. */
export async function generateClinicalAssessmentToken(
  patientId: string,
  patientEmail: string,
): Promise<CNSAssessmentResponse> {
  const apiKey = runtimeSecret("CNS_VITAL_SIGNS_API_KEY");

  if (!apiKey || isPlaceholderKey(apiKey)) {
    console.warn(
      "[CNS VITAL SIGNS] API key missing or placeholder — using fallback test URL.",
    );
    return {
      success: true,
      testUrl: cnsFallbackTestUrl(patientId),
      patientId,
    };
  }

  try {
    const response = await fetch(cnsApiEndpoint(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        externalRef: patientId,
        patientIdentifier: patientEmail.toLowerCase().trim(),
        testBattery: "NeuroNourish_Standard_Cognitive_Panel",
        languageCode: "en-IE",
        autoRedirectUrl: `${siteUrl()}/onboarding?leadId=${patientId}`,
      }),
    });

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new Error(
        errorPayload.message ?? `CNS API returned HTTP ${response.status}`,
      );
    }

    const payload = (await response.json()) as {
      registrationTestUrl?: string;
      testUrl?: string;
    };

    const testUrl = payload.registrationTestUrl ?? payload.testUrl;
    if (!testUrl) {
      throw new Error("CNS API response missing test URL");
    }

    return {
      success: true,
      testUrl,
      patientId,
    };
  } catch (error) {
    console.error("[CNS VITAL SIGNS INTEGRATION FAILURE]", error);
    return {
      success: false,
      patientId,
      testUrl: cnsFallbackTestUrl(patientId),
      error: error instanceof Error ? error.message : "CNS API request failed",
    };
  }
}

/** Resolves the patient-facing CNS URL after registration (with fallback). */
export async function resolveCnsAssessmentTestUrl(
  patientId: string,
  patientEmail: string,
): Promise<{ testUrl: string; registration: CNSAssessmentResponse }> {
  const registration = await generateClinicalAssessmentToken(patientId, patientEmail);
  const testUrl =
    registration.success && registration.testUrl
      ? registration.testUrl
      : cnsFallbackTestUrl(patientId);
  return { testUrl, registration };
}
