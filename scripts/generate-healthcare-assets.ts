#!/usr/bin/env npx tsx
/**
 * Generate Booked Consult marketing assets (OG images + CRM screenshot).
 * Run: npm run healthcare:generate-assets
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const ogDir = join(root, "public", "og");
const crmDir = join(root, "public", "images", "for-clinics");

mkdirSync(ogDir, { recursive: true });
mkdirSync(crmDir, { recursive: true });

function ogSvg(input: {
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: string;
}): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1c1c55"/>
      <stop offset="100%" stop-color="#12123a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="598" width="1200" height="32" fill="${input.accent}"/>
  <text x="72" y="120" fill="#f98e38" font-family="system-ui,sans-serif" font-size="28" font-weight="600" letter-spacing="2">${input.eyebrow}</text>
  <text x="72" y="220" fill="#ffffff" font-family="Georgia,serif" font-size="64" font-weight="500">${input.title}</text>
  <text x="72" y="300" fill="#cbd5e1" font-family="system-ui,sans-serif" font-size="32">${input.subtitle}</text>
  <text x="72" y="560" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="24">bookedconsult.com</text>
</svg>`;
}

function crmSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
  <rect width="1440" height="900" fill="#f8fafc"/>
  <rect x="48" y="48" width="1344" height="804" rx="24" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  <rect x="48" y="48" width="1344" height="72" rx="24" fill="#1c1c55"/>
  <rect x="48" y="96" width="1344" height="24" fill="#1c1c55"/>
  <text x="88" y="96" fill="#ffffff" font-family="system-ui,sans-serif" font-size="28" font-weight="600">Booked Consult — Ops workspace</text>
  <rect x="1280" y="68" width="72" height="32" rx="16" fill="#f98e3820"/>
  <text x="1298" y="90" fill="#f98e38" font-family="system-ui,sans-serif" font-size="16" font-weight="700">Live</text>
  <text x="88" y="180" fill="#64748b" font-family="system-ui,sans-serif" font-size="18" font-weight="700">NEW TODAY</text>
  <text x="520" y="180" fill="#64748b" font-family="system-ui,sans-serif" font-size="18" font-weight="700">BOOKED</text>
  <text x="952" y="180" fill="#64748b" font-family="system-ui,sans-serif" font-size="18" font-weight="700">SHOW RATE</text>
  <text x="88" y="240" fill="#1c1c55" font-family="system-ui,sans-serif" font-size="48" font-weight="700">4</text>
  <text x="520" y="240" fill="#1c1c55" font-family="system-ui,sans-serif" font-size="48" font-weight="700">2</text>
  <text x="952" y="240" fill="#1c1c55" font-family="system-ui,sans-serif" font-size="48" font-weight="700">67%</text>
  <line x1="88" y1="280" x2="1352" y2="280" stroke="#e2e8f0" stroke-width="2"/>
  <text x="88" y="340" fill="#1c1c55" font-family="system-ui,sans-serif" font-size="28" font-weight="600">Sarah M.</text>
  <text x="88" y="372" fill="#64748b" font-family="system-ui,sans-serif" font-size="22">Booked · Callbacks</text>
  <text x="1240" y="340" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="22">2m ago</text>
  <line x1="88" y1="400" x2="1352" y2="400" stroke="#f1f5f9" stroke-width="2"/>
  <text x="88" y="460" fill="#1c1c55" font-family="system-ui,sans-serif" font-size="28" font-weight="600">James T.</text>
  <text x="88" y="492" fill="#64748b" font-family="system-ui,sans-serif" font-size="22">New · New lead</text>
  <text x="1240" y="460" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="22">8m ago</text>
  <line x1="88" y1="520" x2="1352" y2="520" stroke="#f1f5f9" stroke-width="2"/>
  <text x="88" y="580" fill="#1c1c55" font-family="system-ui,sans-serif" font-size="28" font-weight="600">Priya K.</text>
  <text x="88" y="612" fill="#64748b" font-family="system-ui,sans-serif" font-size="22">Qualified · Inbox</text>
  <text x="1240" y="580" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="22">22m ago</text>
</svg>`;
}

async function writeSvgPng(svg: string, pngPath: string, webpPath?: string) {
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(pngPath, png);
  if (webpPath) {
    const webp = await sharp(png).webp({ quality: 88 }).toBuffer();
    writeFileSync(webpPath, webp);
  }
}

async function main() {
  await writeSvgPng(
    ogSvg({
      eyebrow: "FOR IMPLANT CLINICS",
      title: "Booked Consult",
      subtitle: "10 booked implant consults in 45 days · £2,500 pilot",
      accent: "#f98e38",
    }),
    join(ogDir, "for-clinics.png"),
  );

  await writeSvgPng(
    ogSvg({
      eyebrow: "FREE CONSULTATION",
      title: "Dental implant consultation",
      subtitle: "Book online in under 2 minutes · Confirmation by SMS",
      accent: "#f98e38",
    }),
    join(ogDir, "implants.png"),
  );

  await writeSvgPng(
    crmSvg(),
    join(crmDir, "crm-workspace.png"),
    join(crmDir, "crm-workspace.webp"),
  );

  console.log("✓ public/og/for-clinics.png");
  console.log("✓ public/og/implants.png");
  console.log("✓ public/images/for-clinics/crm-workspace.webp");
  console.log("✓ public/images/for-clinics/crm-workspace.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
