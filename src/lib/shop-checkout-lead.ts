import type { Lead } from "@/generated/prisma/client";
import { validateDobForCns } from "@/lib/cnsvitalsigns";
import { db } from "@/lib/db";
import { nnLegacyLoanStub } from "@/lib/neuronourish-workspace";

export type ShopCheckoutIdentity = {
  leadId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  /** When true, DOB is required (cognitive assessment). */
  requireDob?: boolean;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

async function findLeadByEmail(email: string): Promise<Lead | null> {
  const normalized = normalizeEmail(email);
  const leads = await db.lead.findMany();
  return leads.find((l) => normalizeEmail(l.email) === normalized) ?? null;
}

/**
 * Resolves or creates a lead for shop checkout. Optionally stores DOB for CNS.
 */
export async function resolveShopCheckoutLead(
  input: ShopCheckoutIdentity,
): Promise<{ lead?: Lead; error?: string }> {
  const requireDob = Boolean(input.requireDob);
  let lead: Lead | null = null;

  if (input.leadId) {
    lead = await db.lead.findUnique({ where: { id: input.leadId } });
  }

  const email = typeof input.email === "string" ? normalizeEmail(input.email) : "";
  const firstName = typeof input.firstName === "string" ? input.firstName.trim() : "";
  const lastName = typeof input.lastName === "string" ? input.lastName.trim() : "";
  const phoneRaw = typeof input.phone === "string" ? input.phone.trim() : "";
  const phone = phoneRaw ? normalizePhone(phoneRaw) : "";

  if (requireDob && phone && phone.replace(/\D/g, "").length < 7) {
    return { error: "Enter a valid phone number" };
  }

  if (!lead) {
    if (!email || !firstName || !lastName) {
      return { error: "First name, last name, and email are required for checkout" };
    }
    if (requireDob && !phone) {
      return { error: "Phone number is required for the cognitive assessment" };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Enter a valid email address" };
    }

    lead = await findLeadByEmail(email);
    if (lead) {
      lead = await db.lead.update({
        where: { id: lead.id },
        data: {
          firstName: firstName || lead.firstName,
          lastName: lastName || lead.lastName,
          email,
          ...(phone && (!lead.phone || lead.phone === "not_provided") ? { phone } : phone ? { phone } : {}),
        },
      });
    } else {
      lead = await db.lead.create({
        data: {
          firstName,
          lastName,
          email,
          phone: phone || "not_provided",
          ...nnLegacyLoanStub("shop_checkout"),
          source: "shop_checkout",
          funnelStage: "eoi_submitted",
          formCompleted: true,
          qualificationTier: "unscreened",
        },
      });
    }
  } else if (email || firstName || lastName || phone) {
    lead = await db.lead.update({
      where: { id: lead.id },
      data: {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      },
    });
  }

  if (!lead) {
    return { error: "Could not resolve checkout lead" };
  }

  if (requireDob && (!lead.phone || lead.phone === "not_provided") && !phone) {
    return { lead, error: "Phone number is required for the cognitive assessment" };
  }

  const dobRaw = typeof input.dateOfBirth === "string" ? input.dateOfBirth.trim() : "";
  if (requireDob && !dobRaw && !lead.dateOfBirth) {
    return { lead, error: "Date of birth is required for the cognitive assessment" };
  }

  if (dobRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dobRaw)) {
      return { lead, error: "Use date format YYYY-MM-DD" };
    }
    const dob = new Date(`${dobRaw}T00:00:00.000Z`);
    const dobError = validateDobForCns(dob);
    if (dobError) return { lead, error: dobError };
    lead = await db.lead.update({
      where: { id: lead.id },
      data: { dateOfBirth: dob },
    });
  }

  return { lead };
}
