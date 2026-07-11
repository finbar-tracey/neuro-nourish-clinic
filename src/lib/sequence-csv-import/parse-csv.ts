import { LOAN_PURPOSES } from "@/lib/validations";
import type { ParsedImportRow } from "@/lib/sequence-csv-import/types";
import { MAX_IMPORT_ROWS } from "@/lib/sequence-csv-import/types";

const HEADER_ALIASES: Record<string, keyof Omit<ParsedImportRow, "line" | "usedDefaultAmount">> = {
  email: "email",
  "e-mail": "email",
  "email address": "email",
  first_name: "firstName",
  firstname: "firstName",
  "first name": "firstName",
  last_name: "lastName",
  lastname: "lastName",
  "last name": "lastName",
  phone: "phone",
  mobile: "phone",
  telephone: "phone",
  loan_amount: "loanAmount",
  "loan amount": "loanAmount",
  amount: "loanAmount",
  loan_purpose: "loanPurpose",
  "loan purpose": "loanPurpose",
  purpose: "loanPurpose",
  property_location: "propertyLocation",
  "property location": "propertyLocation",
  location: "propertyLocation",
  external_id: "externalId",
  "external id": "externalId",
  notes: "notes",
  note: "notes",
};

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function mapHeader(header: string): keyof Omit<ParsedImportRow, "line" | "usedDefaultAmount"> | null {
  const key = header.trim().toLowerCase().replace(/\s+/g, " ");
  return HEADER_ALIASES[key] ?? null;
}

function parseLoanAmount(raw: string): { amount: number; usedDefault: boolean } {
  const cleaned = raw.replace(/[£,\s]/g, "");
  if (!cleaned) return { amount: 250_000, usedDefault: true };
  const n = Number.parseInt(cleaned, 10);
  if (!Number.isFinite(n)) return { amount: 250_000, usedDefault: true };
  if (n < 50_000) return { amount: 50_000, usedDefault: true };
  if (n > 10_000_000) return { amount: 10_000_000, usedDefault: true };
  return { amount: n, usedDefault: false };
}

function parseLoanPurpose(raw: string): string {
  const value = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (!value) return "purchase";
  const match = LOAN_PURPOSES.find(
    (p) => p.value === value || p.label.toLowerCase() === raw.trim().toLowerCase(),
  );
  return match?.value ?? "purchase";
}

export function parseImportCsv(csvText: string): {
  rows: ParsedImportRow[];
  errors: string[];
} {
  const errors: string[] = [];
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must include a header row and at least one data row"] };
  }

  const headerCells = parseCsvLine(lines[0]!);
  const columnMap = new Map<number, keyof Omit<ParsedImportRow, "line" | "usedDefaultAmount">>();
  for (const [index, header] of headerCells.entries()) {
    const mapped = mapHeader(header);
    if (mapped) columnMap.set(index, mapped);
  }

  if (![...columnMap.values()].includes("email")) {
    return { rows: [], errors: ["Missing required column: email"] };
  }

  const dataLines = lines.slice(1);
  if (dataLines.length > MAX_IMPORT_ROWS) {
    errors.push(`Too many rows (${dataLines.length}). Maximum is ${MAX_IMPORT_ROWS}.`);
    return { rows: [], errors };
  }

  const rows: ParsedImportRow[] = [];

  for (const [offset, line] of dataLines.entries()) {
    const lineNo = offset + 2;
    const cells = parseCsvLine(line);
    const record: Partial<ParsedImportRow> = {
      line: lineNo,
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      loanAmount: 250_000,
      loanPurpose: "purchase",
      propertyLocation: "Unknown",
      externalId: null,
      notes: null,
      usedDefaultAmount: true,
    };

    for (const [index, field] of columnMap.entries()) {
      const raw = cells[index] ?? "";
      if (field === "loanAmount") {
        const parsed = parseLoanAmount(raw);
        record.loanAmount = parsed.amount;
        record.usedDefaultAmount = parsed.usedDefault;
      } else if (field === "loanPurpose") {
        record.loanPurpose = parseLoanPurpose(raw);
      } else if (field === "externalId" || field === "notes") {
        record[field] = raw || null;
      } else {
        record[field] = raw;
      }
    }

    const email = String(record.email ?? "").trim().toLowerCase();
    if (email.startsWith("example_delete_me")) continue;

    rows.push({ ...(record as ParsedImportRow), email });
  }

  return { rows, errors };
}

export function isValidImportEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function slugifyCampaign(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

export function importCsvTemplate(sequenceId: string): string {
  const headers =
    "email,first_name,last_name,phone,loan_amount,loan_purpose,property_location,external_id,notes";
  const example =
    "EXAMPLE_DELETE_ME@example.com,Example,Lead,07123456789,250000,purchase,London,ext-001,Delete this row before import";
  return [
    `# Sequence: ${sequenceId}`,
    `# Max ${MAX_IMPORT_ROWS} rows. Required: email, first_name, last_name, phone`,
    headers,
    example,
  ].join("\n");
}
