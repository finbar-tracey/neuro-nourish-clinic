#!/usr/bin/env npx tsx
/**
 * Export branded email HTML previews — no Resend calls, no test sends.
 *
 * Run: npm run email:preview
 * Open: email-previews/index.html
 * PDFs:  email-previews/pdf/*.pdf + blb-email-design-guide.pdf
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { emailCatalog } from "../src/lib/email-catalog";
import { brandedEmailHtml, logoDataUri } from "../src/lib/email-templates";

const OUT = path.join(process.cwd(), "email-previews");
const PDF_DIR = path.join(OUT, "pdf");
const logoUri = logoDataUri();

function slug(id: string) {
  return id.replace(/[^a-z0-9-]/gi, "-");
}

function extractBody(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match?.[1]?.trim() ?? html;
}

function renderEntry(entry: (ReturnType<typeof emailCatalog>)[number]) {
  return brandedEmailHtml(entry.body, entry.subject, {
    ...entry.options,
    embedInlineAssets: true,
    logoUrl: logoUri ?? entry.options?.logoUrl,
    stageLabel: entry.stage,
    preheader: entry.subject,
    showPhoneCta: entry.audience === "borrower" && entry.options?.showPhoneCta !== false,
  });
}

function printToPdf(htmlPath: string, pdfPath: string) {
  const chromePaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  for (const chrome of chromePaths) {
    if (!fs.existsSync(chrome)) continue;
    const result = spawnSync(
      chrome,
      [
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        `--print-to-pdf=${pdfPath}`,
        `file://${htmlPath}`,
      ],
      { stdio: "pipe" },
    );
    if (result.status === 0 && fs.existsSync(pdfPath)) return true;
  }
  return false;
}

function indexHtml(borrowerCards: string, brokerCards: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>BLB Email Design Guide</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1c1c55; }
    .hero { background: #1c1c55; color: #fff; padding: 48px 24px; border-bottom: 4px solid #f98e38; }
    .hero h1 { margin: 0 0 8px; font-size: 28px; }
    .hero p { margin: 0; color: #ffaa5c; max-width: 720px; line-height: 1.5; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 32px 20px 64px; }
    h2.section { font-size: 18px; margin: 32px 0 16px; color: #1c1c55; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; text-decoration: none; color: inherit; }
    .card:hover { box-shadow: 0 8px 24px rgba(28,28,85,.08); }
    .badge { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; margin-right: 6px; }
    .live { background: #dcfce7; color: #166534; }
    .broker { background: #ede9fe; color: #5b21b6; }
    .stage { font-size: 12px; color: #64748b; margin: 8px 0 4px; }
    .subject { font-weight: 600; font-size: 14px; line-height: 1.4; }
    .links { background: #fffeee; border: 1px solid rgba(249,142,56,.3); border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Bridging Loans Broker — Email Design Guide</h1>
    <p>Every automation and journey-stage email — navy header, orange accent, logo. Generated locally; nothing sent via Resend.</p>
  </div>
  <div class="wrap">
    <div class="links">
      <strong>PDFs:</strong> <code>email-previews/pdf/</code> (one per template) ·
      <code>blb-email-design-guide.pdf</code> (combined) ·
      <code>borrower-journey-emails.pdf</code> (borrower only)
    </div>
    <h2 class="section">Borrower journey & automations</h2>
    <div class="grid">${borrowerCards}</div>
    <h2 class="section">Broker automations</h2>
    <div class="grid">${brokerCards}</div>
  </div>
</body>
</html>`;
}

function printGuide(sections: string, title: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { margin: 10mm; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #fff; }
    .cover { page-break-after: always; padding: 48px 40px; background: #1c1c55; color: #fff; min-height: 85vh; }
    .cover h1 { font-size: 30px; margin: 0 0 12px; }
    .cover p { color: #ffaa5c; font-size: 15px; line-height: 1.6; max-width: 520px; }
    .cover img { margin-bottom: 24px; height: 52px; width: auto; }
    .meta { page-break-before: always; padding: 20px 0 6px; border-bottom: 2px solid #f98e38; margin-bottom: 6px; }
    .meta h2 { margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; }
    .meta h3 { margin: 0 0 4px; font-size: 17px; color: #1c1c55; }
    .meta p { margin: 0; font-size: 11px; color: #64748b; }
    .email-frame { page-break-after: always; padding-bottom: 16px; }
  </style>
</head>
<body>
  <div class="cover">
    ${logoUri ? `<img src="${logoUri}" alt="Bridging Loans Broker" />` : ""}
    <h1>${title}</h1>
    <p>On-brand templates for automations and each borrower journey step. Generated ${new Date().toLocaleString("en-GB")} — no test sends.</p>
  </div>
  ${sections}
</body>
</html>`;
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(PDF_DIR, { recursive: true });

  const catalog = emailCatalog();
  const borrowerCards: string[] = [];
  const brokerCards: string[] = [];
  const allSections: string[] = [];
  const borrowerSections: string[] = [];
  let pdfCount = 0;

  for (const entry of catalog) {
    const html = renderEntry(entry);
    const filename = `${slug(entry.id)}.html`;
    const htmlPath = path.join(OUT, filename);
    fs.writeFileSync(htmlPath, html);

    const pdfPath = path.join(PDF_DIR, `${slug(entry.id)}.pdf`);
    if (printToPdf(htmlPath, pdfPath)) pdfCount++;

    const card = `<a class="card" href="${filename}" target="_blank">
      <span class="badge live">live</span>
      ${entry.audience === "broker" ? '<span class="badge broker">broker</span>' : ""}
      <div class="stage">${entry.stage}</div>
      <div class="subject">${entry.subject}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:8px">PDF: pdf/${slug(entry.id)}.pdf</div>
    </a>`;

    if (entry.audience === "borrower") borrowerCards.push(card);
    else brokerCards.push(card);

    const section = `<div class="meta">
      <h2>${entry.stage}${entry.audience === "broker" ? " · broker" : ""}</h2>
      <h3>${entry.subject}</h3>
      <p>${entry.trigger}</p>
    </div>
    <div class="email-frame">${extractBody(html)}</div>`;

    allSections.push(section);
    if (entry.audience === "borrower") borrowerSections.push(section);
  }

  fs.writeFileSync(path.join(OUT, "index.html"), indexHtml(borrowerCards.join("\n"), brokerCards.join("\n")));

  const combinedPrint = path.join(OUT, "all-emails-print.html");
  const borrowerPrint = path.join(OUT, "borrower-emails-print.html");
  fs.writeFileSync(combinedPrint, printGuide(allSections.join("\n"), "All journey & automation emails"));
  fs.writeFileSync(
    borrowerPrint,
    printGuide(borrowerSections.join("\n"), "Borrower journey emails"),
  );

  const combinedPdf = path.join(OUT, "blb-email-design-guide.pdf");
  const borrowerPdf = path.join(OUT, "borrower-journey-emails.pdf");
  printToPdf(combinedPrint, combinedPdf);
  printToPdf(borrowerPrint, borrowerPdf);

  console.log("\n📧 Email preview export (no sends)\n");
  console.log(`   ${catalog.length} templates → ${OUT}/`);
  console.log(`   Borrower: ${catalog.filter((e) => e.audience === "borrower").length}`);
  console.log(`   Individual PDFs: ${pdfCount} in email-previews/pdf/`);
  console.log(`   Combined PDF: email-previews/blb-email-design-guide.pdf`);
  console.log(`   Borrower PDF: email-previews/borrower-journey-emails.pdf`);
  console.log(`\n   Open: file://${OUT}/index.html\n`);
}

function joinPath(a: string, b: string) {
  return path.join(a, b);
}

main();
