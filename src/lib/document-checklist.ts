export const BRIDGING_DOCUMENT_TEMPLATE = [
  { docKey: "proof_of_id", label: "Proof of ID", required: true },
  { docKey: "proof_of_address", label: "Proof of address", required: true },
  { docKey: "bank_statements", label: "3 months bank statements", required: true },
  { docKey: "proof_of_deposit", label: "Proof of deposit/equity", required: true },
  { docKey: "property_details", label: "Property details", required: true },
  { docKey: "purchase_contract", label: "Purchase contract or auction pack", required: false },
  { docKey: "mortgage_statement", label: "Existing mortgage statement (if refinance)", required: false },
  { docKey: "company_documents", label: "Company documents (if limited company)", required: false },
  { docKey: "exit_strategy", label: "Exit strategy evidence", required: false },
] as const;

export type DocumentItem = {
  docKey: string;
  label: string;
  required: boolean;
};
