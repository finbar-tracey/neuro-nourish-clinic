#!/usr/bin/env node
/**
 * Remove solid backgrounds from NeuroNourish logo JPEGs → transparent PNGs.
 */
import sharp from "sharp";
import { copyFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/brand");

const ASSETS = resolve(
  ROOT,
  "../../.cursor/projects/Users-josephpenman-Downloads-neuro-nourish-clinic/assets",
);

function dist(a, b) {
  return Math.abs(a - b);
}

function removeBackground(raw, info, mode) {
  const { width, height, channels } = info;
  const out = Buffer.from(raw);

  if (mode === "white") {
    const total = width * height;
    const isBg = new Uint8Array(total);
    const queue = [];

    const matchesWhiteBg = (r, g, b) => {
      const avg = (r + g + b) / 3;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      return avg > 198 && chroma < 28;
    };

    const trySeed = (x, y) => {
      const idx = y * width + x;
      if (isBg[idx]) return;
      const o = idx * channels;
      if (matchesWhiteBg(out[o], out[o + 1], out[o + 2])) {
        isBg[idx] = 1;
        queue.push(idx);
      }
    };

    for (let x = 0; x < width; x++) {
      trySeed(x, 0);
      trySeed(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      trySeed(0, y);
      trySeed(width - 1, y);
    }

    while (queue.length > 0) {
      const idx = queue.pop();
      const x = idx % width;
      const y = (idx - x) / width;
      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nIdx = ny * width + nx;
        if (isBg[nIdx]) continue;
        const o = nIdx * channels;
        if (matchesWhiteBg(out[o], out[o + 1], out[o + 2])) {
          isBg[nIdx] = 1;
          queue.push(nIdx);
        }
      }
    }

    for (let i = 0; i < total; i++) {
      const o = i * channels;
      const r = out[o];
      const g = out[o + 1];
      const b = out[o + 2];
      if (isBg[i]) {
        out[o + 3] = 0;
        continue;
      }

      const avg = (r + g + b) / 3;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      if (avg > 198 && chroma < 28) {
        out[o + 3] = Math.max(0, Math.min(255, Math.round((220 - avg) * 12)));
      }
    }

    return out;
  }

  if (mode === "black") {
    const total = width * height;
    const isBg = new Uint8Array(total);
    const queue = [];

    const matchesBlackBg = (r, g, b) => {
      const avg = (r + g + b) / 3;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      return avg < 42 && chroma < 30;
    };

    const trySeed = (x, y) => {
      const idx = y * width + x;
      if (isBg[idx]) return;
      const o = idx * channels;
      if (matchesBlackBg(out[o], out[o + 1], out[o + 2])) {
        isBg[idx] = 1;
        queue.push(idx);
      }
    };

    for (let x = 0; x < width; x++) {
      trySeed(x, 0);
      trySeed(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      trySeed(0, y);
      trySeed(width - 1, y);
    }

    while (queue.length > 0) {
      const idx = queue.pop();
      const x = idx % width;
      const y = (idx - x) / width;
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nIdx = ny * width + nx;
        if (isBg[nIdx]) continue;
        const o = nIdx * channels;
        if (matchesBlackBg(out[o], out[o + 1], out[o + 2])) {
          isBg[nIdx] = 1;
          queue.push(nIdx);
        }
      }
    }

    for (let i = 0; i < total; i++) {
      const o = i * channels;
      if (isBg[i]) {
        out[o + 3] = 0;
        continue;
      }

      const r = out[o];
      const g = out[o + 1];
      const b = out[o + 2];
      const avg = (r + g + b) / 3;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      if (avg < 42 && chroma < 30) {
        out[o + 3] = Math.max(0, Math.min(255, Math.round((avg - 18) * 8)));
      }
    }

    return out;
  }

  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    const r = out[o];
    const g = out[o + 1];
    const b = out[o + 2];
    let alpha = 255;

    if (mode === "dark") {
      // Charcoal plate behind dark lockup
      const avg = (r + g + b) / 3;
      if (avg < 95 && dist(r, g) < 18 && dist(g, b) < 18) alpha = 0;
      else if (avg < 120 && dist(r, g) < 15 && dist(g, b) < 15) {
        alpha = Math.min(255, Math.max(0, (avg - 70) * 6));
      }
    }

    out[o + 3] = alpha;
  }

  return out;
}

function subjectBounds(data, info) {
  const { width, height, channels } = info;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return { left: 0, top: 0, width, height };
  }

  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.04);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function portraitCropFromSubject(bounds, imageWidth, imageHeight) {
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height * 0.26;
  const size = Math.round(
    Math.min(bounds.width * 0.72, bounds.height * 0.52, imageWidth, imageHeight),
  );

  let left = Math.round(centerX - size / 2);
  let cropTop = Math.round(centerY - size * 0.38);

  left = Math.max(0, Math.min(left, imageWidth - size));
  cropTop = Math.max(0, Math.min(cropTop, imageHeight - size));

  return { left, top: cropTop, width: size, height: size };
}

/** Remove black-matte fringe and bake onto white for clean circular display. */
function matteOnWhite(raw, info) {
  const { width, height, channels } = info;
  const out = Buffer.from(raw);

  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    let alpha = out[o + 3];
    let r = out[o];
    let g = out[o + 1];
    let b = out[o + 2];
    const avg = (r + g + b) / 3;

    if (alpha <= 8) {
      out[o] = 255;
      out[o + 1] = 255;
      out[o + 2] = 255;
      out[o + 3] = 255;
      continue;
    }

    const alphaF = alpha / 255;
    if (alpha < 220 && avg < 90) {
      out[o] = 255;
      out[o + 1] = 255;
      out[o + 2] = 255;
      out[o + 3] = 255;
      continue;
    }

    if (alpha < 255 && avg >= 90) {
      r = Math.min(255, r / alphaF);
      g = Math.min(255, g / alphaF);
      b = Math.min(255, b / alphaF);
    }

    out[o] = Math.round(r * alphaF + 255 * (1 - alphaF));
    out[o + 1] = Math.round(g * alphaF + 255 * (1 - alphaF));
    out[o + 2] = Math.round(b * alphaF + 255 * (1 - alphaF));
    out[o + 3] = 255;
  }

  return out;
}

async function processLogo(input, output, mode) {
  if (!existsSync(input)) {
    console.warn(`skip missing: ${input}`);
    return;
  }

  const pipeline = sharp(input).ensureAlpha();
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const processed = removeBackground(data, info, mode);

  await sharp(processed, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .trim({ threshold: 10 })
    .toFile(output);

  const meta = await sharp(output).metadata();
  console.log(`✓ ${output} (${meta.width}×${meta.height}, alpha=${meta.hasAlpha})`);
}

const jobs = [
  {
    input: resolve(ASSETS, "2-6b7c9e40-31df-4b51-95af-289c2e37cfa4.png"),
    output: resolve(OUT, "neuronourish-brain.png"),
    mode: "white",
    fallback: resolve(OUT, "neuronourish-brain.png"),
  },
  {
    input: resolve(ASSETS, "3-6449617f-0e0b-49f2-b7a2-609ab77b877b.png"),
    output: resolve(OUT, "neuronourish-logo.png"),
    mode: "white",
    fallback: resolve(OUT, "neuronourish-logo.png"),
  },
  {
    input: resolve(ASSETS, "4-68cac0f0-6dd2-41b7-b77d-c727de67beaa.png"),
    output: resolve(OUT, "neuronourish-logo-dark.png"),
    mode: "dark",
    fallback: resolve(OUT, "neuronourish-logo-dark.png"),
  },
];

for (const job of jobs) {
  const input = existsSync(job.input) ? job.input : job.fallback;
  await processLogo(input, job.output, job.mode);
}

const emerCandidates = [
  "emer-221ec100-eca9-4ca8-94de-3c3d7843f9b3.png",
  "emer-cb5bee1c-54e5-454a-a8e8-ab060710151c.png",
];
const emerInput = emerCandidates
  .map((name) => resolve(ASSETS, name))
  .find((path) => existsSync(path));

const emerCutoutPath = resolve(OUT, "emer-sexton-cutout.png");

async function processEmerFromCutout(cutoutPath) {
  const { data, info } = await sharp(cutoutPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bounds = subjectBounds(data, info);
  const crop = portraitCropFromSubject(bounds, info.width, info.height);
  const portrait = matteOnWhite(data, info);

  await sharp(portrait, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract(crop)
    .jpeg({ quality: 94, mozjpeg: true })
    .toFile(resolve(OUT, "emer-sexton-portrait.jpg"));

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .trim({ threshold: 8 })
    .toFile(resolve(OUT, "emer-sexton.png"));

  const portraitMeta = await sharp(resolve(OUT, "emer-sexton-portrait.jpg")).metadata();
  const meta = await sharp(resolve(OUT, "emer-sexton.png")).metadata();
  console.log(`✓ ${resolve(OUT, "emer-sexton.png")} (${meta.width}×${meta.height}, AI cutout)`);
  console.log(
    `✓ ${resolve(OUT, "emer-sexton-portrait.jpg")} (${portraitMeta.width}×${portraitMeta.height}, portrait crop)`,
  );
}

if (existsSync(emerCutoutPath)) {
  await processEmerFromCutout(emerCutoutPath);
} else if (emerInput) {
  await sharp(emerInput)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .toBuffer()
    .then(async (resized) => {
      const { data, info } = await sharp(resized).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const processed = removeBackground(data, info, "black");
      const transparentPath = resolve(OUT, "emer-sexton.png");
      await sharp(processed, {
        raw: { width: info.width, height: info.height, channels: 4 },
      })
        .png({ compressionLevel: 9 })
        .trim({ threshold: 8 })
        .toFile(transparentPath);

      const trimmed = await sharp(transparentPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const bounds = subjectBounds(trimmed.data, trimmed.info);
      const crop = portraitCropFromSubject(bounds, trimmed.info.width, trimmed.info.height);
      const portrait = matteOnWhite(trimmed.data, trimmed.info);

      await sharp(portrait, {
        raw: { width: trimmed.info.width, height: trimmed.info.height, channels: 4 },
      })
        .extract(crop)
        .jpeg({ quality: 94, mozjpeg: true })
        .toFile(resolve(OUT, "emer-sexton-portrait.jpg"));

      const meta = await sharp(transparentPath).metadata();
      const portraitMeta = await sharp(resolve(OUT, "emer-sexton-portrait.jpg")).metadata();
      console.log(`✓ ${transparentPath} (${meta.width}×${meta.height}, alpha=${meta.hasAlpha})`);
      console.log(
        `✓ ${resolve(OUT, "emer-sexton-portrait.jpg")} (${portraitMeta.width}×${portraitMeta.height}, portrait crop)`,
      );
    });
}

const brainOut = resolve(OUT, "neuronourish-brain.png");
const appleTouch = resolve(ROOT, "public/apple-touch-icon.png");
if (existsSync(brainOut)) {
  copyFileSync(brainOut, appleTouch);
  console.log(`✓ ${appleTouch} (from brain logo)`);
}
