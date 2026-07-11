import fs from "node:fs";
import path from "node:path";

import { GOOGLE_RATING } from "@/lib/reviews";
import {
  emailDanielPhotoUrl,
  emailLogoUrl,
  emailAssetOrigin,
} from "@/lib/email-assets";
import { getSiteUrl } from "@/lib/site-url";

/** Site brand tokens — matches globals.css */
export const EMAIL_BRAND = {
  navy: "#1c1c55",
  navyLight: "#2a2a72",
  navyDark: "#1c2b33",
  orange: "#f98e38",
  orangeLight: "#ffaa5c",
  orangeInk: "#8a3b06",
  cream: "#fffeee",
  text: "#334155",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
  serif: "Georgia, 'Times New Roman', serif",
  sans: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

export type BrandedEmailOptions = {
  /** Primary CTA button (e.g. upload link) */
  cta?: { label: string; href: string };
  /** Absolute logo URL — defaults to production /logo.png */
  logoUrl?: string;
  /** Use base64 assets for offline PDF previews only — never for Resend sends */
  embedInlineAssets?: boolean;
  /** Journey stage shown as pill under header (e.g. "Documents requested") */
  stageLabel?: string;
  /** Inbox preview line (hidden in body) */
  preheader?: string;
  /** Show phone link under primary CTA */
  showPhoneCta?: boolean;
  /** Hide Daniel signature block (healthcare transactional) */
  showDanielSignature?: boolean;
  /** Booked Consult header/footer instead of BLB */
  healthcareBrand?: boolean;
  /** Marketing footer — one-click unsubscribe link */
  unsubscribeUrl?: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linkify(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s<]+)/g,
    `<a href="$1" style="color:${EMAIL_BRAND.orange};font-weight:600;text-decoration:underline">$1</a>`,
  );
}

function formatInline(text: string): string {
  return linkify(escapeHtml(text).replace(/\n/g, "<br>"));
}

function isListLine(line: string): boolean {
  const t = line.trim();
  return /^[•□\-]\s/.test(t) || /^\d+\.\s/.test(t);
}

function listItemHtml(line: string, checklist: boolean): string {
  const numbered = /^\d+\.\s/.test(line.trim());
  const cleaned = line.trim().replace(/^[•□\-]\s*/, "").replace(/^\d+\.\s*/, "");
  const marker = checklist
    ? `<span style="color:${EMAIL_BRAND.orange};font-weight:700;margin-right:8px">□</span>`
    : numbered
      ? `<span style="color:${EMAIL_BRAND.orange};font-weight:700;margin-right:6px">${escapeHtml(line.trim().match(/^(\d+\.)/)?.[1] ?? "•")}</span>`
      : `<span style="color:${EMAIL_BRAND.orange};margin-right:8px">•</span>`;
  return `<li style="margin:0 0 10px;line-height:1.55;color:${EMAIL_BRAND.text};list-style:none">${marker}${formatInline(cleaned)}</li>`;
}

function renderList(lines: string[], checklist: boolean): string {
  const items = lines.map((l) => listItemHtml(l, checklist)).join("");
  const boxStyle = checklist
    ? `background:${EMAIL_BRAND.cream};border-left:4px solid ${EMAIL_BRAND.orange};border-radius:10px;padding:18px 20px 18px 16px;margin:0 0 18px`
    : `background:${EMAIL_BRAND.cream};border-radius:10px;padding:16px 18px;margin:0 0 18px;border:1px solid rgba(249,142,56,0.15)`;
  return `<ul style="list-style:none;margin:0;padding:0;${boxStyle}">${items}</ul>`;
}

function paragraphHtml(text: string): string {
  return `<p style="margin:0 0 16px;line-height:1.65;color:${EMAIL_BRAND.text};font-size:15px">${formatInline(text)}</p>`;
}

function prepareBodyForRender(body: string, options: BrandedEmailOptions): string {
  const href = options.cta?.href;
  return body
    .split(/\n\n+/)
    .filter((block) => {
      const line = block.trim();
      if (!line) return false;
      // Footer already carries the legal line — drop from body in HTML/PDF
      if (/^Subject to status and lender criteria/i.test(line)) return false;
      if (!href) return true;
      if (!line.includes(href)) return true;
      // Drop redundant URL lines when an orange CTA button follows
      return !/(upload|securely)\s+here:/i.test(line)
        && !/^join your consultation:/i.test(line)
        && !/^teams link:/i.test(line)
        && !/^open case:/i.test(line);
    })
    .join("\n\n");
}

function bodyToHtml(body: string): string {
  const blocks = body.split(/\n\n+/);

  return blocks
    .map((block) => {
      const lines = block.split("\n").filter((l) => l.trim());
      if (lines.length === 0) return "";

      const firstListIdx = lines.findIndex(isListLine);
      if (firstListIdx > 0) {
        const intro = lines.slice(0, firstListIdx).join("\n");
        const listLines = lines.slice(firstListIdx);
        const checklist = listLines.some((l) => l.trim().startsWith("□"));
        return paragraphHtml(intro) + renderList(listLines, checklist);
      }

      if (lines.every(isListLine)) {
        const checklist = lines.some((l) => l.trim().startsWith("□"));
        return renderList(lines, checklist);
      }

      return paragraphHtml(block);
    })
    .join("");
}

export function siteLogoUrl(): string {
  return emailLogoUrl();
}

export function siteHomeUrl(): string {
  return getSiteUrl().includes("localhost") ? emailAssetOrigin() : getSiteUrl();
}

function readAssetDataUri(filename: string, mime: string): string | null {
  try {
    const assetPath = path.join(process.cwd(), "public", filename);
    const buf = fs.readFileSync(assetPath);
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Base64 logo for offline previews / clients that block remote images */
export function logoDataUri(): string | null {
  return readAssetDataUri("logo.png", "image/png");
}

export function danielPhotoDataUri(): string | null {
  return readAssetDataUri("daniel-mehrnia.webp", "image/webp");
}

function textLogoFallback(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td style="vertical-align:middle;padding-right:12px">
        <div style="width:44px;height:44px;border-radius:10px;background:${EMAIL_BRAND.orange};color:${EMAIL_BRAND.navy};font-weight:800;font-size:14px;line-height:44px;text-align:center">BLB</div>
      </td>
      <td style="vertical-align:middle">
        <div style="font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#ffffff;line-height:1.2">Bridging Loans</div>
        <div style="font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.orangeLight};line-height:1.2">Broker</div>
      </td>
    </tr>
  </table>`;
}

export function brandedEmailHtml(
  body: string,
  subject: string,
  options: BrandedEmailOptions = {},
): string {
  const content = bodyToHtml(prepareBodyForRender(body, options));
  const logoSrc = options.embedInlineAssets
    ? options.logoUrl ?? logoDataUri() ?? emailLogoUrl()
    : options.logoUrl ?? emailLogoUrl();
  const healthcare = options.healthcareBrand === true;
  const logoBlock = healthcare
    ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;padding-right:12px">
          <div style="width:44px;height:44px;border-radius:10px;background:${EMAIL_BRAND.orange};color:${EMAIL_BRAND.navy};font-weight:800;font-size:14px;line-height:44px;text-align:center">BC</div>
        </td>
        <td style="vertical-align:middle">
          <div style="font-size:15px;font-weight:700;color:#ffffff;line-height:1.2">Booked Consult</div>
          <div style="font-size:12px;color:${EMAIL_BRAND.orangeLight};line-height:1.2">Qualified consultations for clinics</div>
        </td>
      </tr></table>`
    : logoSrc
      ? `<img src="${escapeHtml(logoSrc)}" alt="Bridging Loans Broker" width="180" height="56" style="display:block;height:56px;width:auto;max-width:200px;border:0" />`
      : textLogoFallback();

  const preheader = options.preheader ?? subject;
  const stagePill = options.stageLabel
    ? `<span style="display:inline-block;margin-top:12px;padding:6px 12px;border-radius:999px;background:rgba(249,142,56,0.18);border:1px solid rgba(249,142,56,0.35);color:${EMAIL_BRAND.orangeLight};font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase">${escapeHtml(options.stageLabel)}</span>`
    : "";

  const cta = options.cta;
  const phoneCta =
    options.showPhoneCta !== false
      ? `<p style="margin:0 0 18px;font-size:14px;color:${EMAIL_BRAND.muted}">Prefer to talk now? Call <a href="tel:02071774141" style="color:${EMAIL_BRAND.orange};font-weight:700;text-decoration:none">020 7177 4141</a></p>`
      : "";

  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 12px">
        <tr>
          <td style="border-radius:10px;background:${EMAIL_BRAND.orange};box-shadow:0 2px 0 ${EMAIL_BRAND.orangeInk}">
            <a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:15px 30px;font-size:15px;font-weight:700;color:${EMAIL_BRAND.navy};text-decoration:none;border-radius:10px">${escapeHtml(cta.label)}</a>
          </td>
        </tr>
      </table>${phoneCta}`
    : "";

  const danielPhotoSrc = options.embedInlineAssets
    ? danielPhotoDataUri() ?? emailDanielPhotoUrl()
    : emailDanielPhotoUrl();
  const signaturePhoto = danielPhotoSrc
    ? `<img src="${escapeHtml(danielPhotoSrc)}" alt="Daniel Mehrnia" width="64" height="64" style="display:block;width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid ${EMAIL_BRAND.orange}" />`
    : `<div style="width:64px;height:64px;border-radius:50%;background:${EMAIL_BRAND.navy};color:#fff;font-weight:700;font-size:22px;line-height:64px;text-align:center;border:2px solid ${EMAIL_BRAND.orange}">DM</div>`;

  const trustStrip = `<p style="margin:14px 0 0;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.muted};text-align:center">
      <span style="color:${EMAIL_BRAND.orange};letter-spacing:1px">★★★★★</span>
      <strong style="color:${EMAIL_BRAND.navy}">${GOOGLE_RATING.label}</strong> on Google
      · ${GOOGLE_RATING.count} reviews
      · <a href="${siteHomeUrl()}" style="color:${EMAIL_BRAND.navy};text-decoration:none;font-weight:600">bridgingloansbroker.co.uk</a>
    </p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(subject)}</title>
  <style>
    @page { margin: 14mm; size: A4; }
    @media print {
      body, table, td { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.bg};font-family:${EMAIL_BRAND.sans}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.bg};padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};box-shadow:0 8px 32px rgba(28,28,85,0.08)">
          <tr>
            <td style="height:5px;background:${EMAIL_BRAND.orange};font-size:0;line-height:0">&nbsp;</td>
          </tr>
          <tr>
            <td style="background:${EMAIL_BRAND.navy};background-image:radial-gradient(circle at 85% 0%, rgba(249,142,56,0.22), transparent 55%);padding:26px 28px 24px">
              ${logoBlock}
              <p style="margin:10px 0 0;font-size:13px;color:${EMAIL_BRAND.orange};font-weight:600;letter-spacing:0.02em">${healthcare ? "Dental consultation bookings" : "Independent bridging finance specialists"}</p>
              ${stagePill}
            </td>
          </tr>
          <tr>
            <td style="padding:34px 28px 10px">
              <h1 style="margin:0 0 18px;font-family:${EMAIL_BRAND.serif};font-size:22px;font-weight:500;line-height:1.3;color:${EMAIL_BRAND.navy};letter-spacing:-0.02em">${escapeHtml(subject)}</h1>
              ${content}
              ${ctaHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:6px 28px 28px">
              ${options.showDanielSignature !== false && !healthcare
                ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.cream};border-radius:14px;border:1px solid rgba(249,142,56,0.22)">
                <tr>
                  <td style="padding:20px 22px">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="76" style="vertical-align:top;padding-right:14px">${signaturePhoto}</td>
                        <td style="vertical-align:top">
                          <p style="margin:0;font-size:15px;font-weight:700;color:${EMAIL_BRAND.navy}">Daniel Mehrnia</p>
                          <p style="margin:4px 0 0;font-size:13px;color:${EMAIL_BRAND.muted}">Partner · Bridging Loans Broker</p>
                          <p style="margin:12px 0 0;font-size:14px;line-height:1.6">
                            <a href="tel:02071774141" style="color:${EMAIL_BRAND.orange};font-weight:700;text-decoration:none">020 7177 4141</a><br>
                            <a href="mailto:daniel@bridgingloansbroker.co.uk" style="color:${EMAIL_BRAND.navy};text-decoration:none">daniel@bridgingloansbroker.co.uk</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>`
                : ""}
              ${healthcare ? "" : trustStrip}
              ${options.unsubscribeUrl ? `<p style="margin:14px 0 0;font-size:11px;line-height:1.55;color:#94a3b8;text-align:center"><a href="${escapeHtml(options.unsubscribeUrl)}" style="color:#64748b;text-decoration:underline">Unsubscribe from marketing emails</a></p>` : ""}
              <p style="margin:14px 0 0;font-size:11px;line-height:1.55;color:#94a3b8;text-align:center">${healthcare ? "Booked Consult arranges consultation bookings on behalf of participating dental clinics. We do not provide clinical advice. Treatment is delivered by registered dental professionals." : "Business and investment purposes only. Subject to status and lender criteria.<br>Bridging Loans Broker · 12 Old Bond Street, Mayfair, London W1S 4PP"}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
