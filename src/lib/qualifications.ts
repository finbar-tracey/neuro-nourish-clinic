export type DisqualifyCode = "min_loan" | "occupancy" | "long_timeframe";

export type DisqualifyResult = {
  qualified: false;
  code: DisqualifyCode;
  title: string;
  message: string;
  /** When true, show nurture confirmation (email sequence enrolled) */
  nurtureEnrolled?: boolean;
};

export type QualificationResult = { qualified: true } | DisqualifyResult;

const MIN_LOAN_AMOUNT = 50_000;

export function checkLeadQualification(data: {
  loanAmount: number;
  willOccupy: boolean;
  hasEverOccupied: boolean;
}): QualificationResult {
  if (data.loanAmount < MIN_LOAN_AMOUNT) {
    return {
      qualified: false,
      code: "min_loan",
      title: "Below our minimum loan size",
      message:
        "We arrange bridging loans from £50,000 for business and investment purposes. For smaller amounts, please speak to an FCA-regulated mortgage or personal finance adviser.",
    };
  }

  if (data.willOccupy || data.hasEverOccupied) {
    return {
      qualified: false,
      code: "occupancy",
      title: "Unable to assist with this enquiry",
      message:
        "Bridging Loans Broker provides unregulated bridging finance for business and investment purposes only. We cannot arrange finance where you intend to live in the property, or where you or a family member has previously lived in it. Please contact an FCA-regulated mortgage adviser for residential finance.",
    };
  }

  return { qualified: true };
}

export function checkLongTimeframeQualification(timeframe: string): DisqualifyResult {
  return {
    qualified: false,
    code: "long_timeframe",
    nurtureEnrolled: true,
    title: "Still researching?",
    message:
      "Bridging loans work best when you have a deal in mind. Since you're still researching, we've added you to our free email guide series — we'll help you prepare so you're ready when the time comes.",
  };
}

export const MIN_LOAN = MIN_LOAN_AMOUNT;
