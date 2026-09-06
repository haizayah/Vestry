import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "data", "uploads", "harbor-rehearsal.wav");

const sampleRate = 22050;
const seconds = 4;
const samples = sampleRate * seconds;
const buffer = Buffer.alloc(44 + samples * 2);

buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + samples * 2, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(samples * 2, 40);

for (let i = 0; i < samples; i++) {
  const t = i / sampleRate;
  const env = Math.min(1, t * 4) * Math.min(1, (seconds - t) * 2);
  const wave =
    0.32 * Math.sin(2 * Math.PI * 196 * t) +
    0.22 * Math.sin(2 * Math.PI * 246.94 * t) +
    0.18 * Math.sin(2 * Math.PI * 293.66 * t);
  const value = Math.max(-1, Math.min(1, wave * env));
  buffer.writeInt16LE(Math.round(value * 28000), 44 + i * 2);
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, buffer);
console.log(`wrote ${out}`);
