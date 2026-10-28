// Rebuild the small contact sheet after replacing a generated CG. Originals stay untouched.
import sharp from 'sharp';
import { stat } from 'node:fs/promises';

const columns = 5, rows = 4, width = 320, height = 180;
const input = 'public/assets/cg/generated';
const output = 'public/assets/cg/index.webp';
const tiles = await Promise.all(Array.from({ length: columns * rows }, async (_, index) => ({
  input: await sharp(`${input}/scene-${String(index + 1).padStart(2, '0')}.webp`).resize(width, height, { fit: 'cover' }).toBuffer(),
  left: index % columns * width,
  top: Math.floor(index / columns) * height,
})));
await sharp({ create: { width: width * columns, height: height * rows, channels: 3, background: '#090d12' } })
  .composite(tiles).webp({ quality: 72 }).toFile(output);
console.log(`${output}: ${(await stat(output)).size} bytes`);
