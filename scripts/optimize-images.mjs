import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SOURCES = [
  // Hero slides (used by HomePage)
  "attached_assets/IMG_3267_1776604323710.png",
  "attached_assets/IMG_3548_1776605362190.jpeg",
  "attached_assets/IMG_3549_1776605362190.jpeg",
  // Van images
  "attached_assets/IMG_3408_1776508670556.jpeg",
  "attached_assets/IMG_3409_1776508670556.jpeg",
  "attached_assets/IMG_3410_1776508670556.jpeg",
  // Waste load images
  "attached_assets/IMG_3575_1776610167208.jpeg",
  "attached_assets/IMG_3576_1776610167208.jpeg",
  "attached_assets/IMG_3577_1776610167208.jpeg",
  "attached_assets/IMG_3578_1776610167208.jpeg",
  "attached_assets/IMG_3579_1776610167209.jpeg",
  "attached_assets/IMG_3580_1776610167209.jpeg",
  // Reviews section
  "artifacts/move4u/src/assets/reviews/move4u_real_move.png",
];

const MAX_WIDTH = 1600;
const TARGET_MIN = 200 * 1024;
const TARGET_MAX = 320 * 1024;
const QUALITIES = [82, 75, 68, 60, 52, 45];

async function convert(file) {
  const out = file.replace(/\.(png|jpe?g)$/i, ".webp");
  const meta = await sharp(file).metadata();
  const resize = meta.width && meta.width > MAX_WIDTH ? { width: MAX_WIDTH } : null;

  let chosen = null;
  for (const q of QUALITIES) {
    let pipe = sharp(file).rotate();
    if (resize) pipe = pipe.resize(resize);
    const buf = await pipe.webp({ quality: q, effort: 5 }).toBuffer();
    chosen = { q, buf };
    if (buf.length <= TARGET_MAX) break;
  }
  await fs.writeFile(out, chosen.buf);
  const origKB = ((await fs.stat(file)).size / 1024).toFixed(0);
  const newKB = (chosen.buf.length / 1024).toFixed(0);
  console.log(
    `${path.basename(out)}  q=${chosen.q}  ${origKB}KB → ${newKB}KB  (${meta.width}x${meta.height}${resize ? " → " + MAX_WIDTH + "w" : ""})`,
  );
}

for (const f of SOURCES) {
  try {
    await convert(f);
  } catch (e) {
    console.error("FAIL", f, e.message);
  }
}
