const fs = require('fs');
const path = require('path');

function createWavBuffer(samples, sampleRate = 44100) {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.floor(val), 44 + i * 2);
  }

  return buffer;
}

const sampleRate = 44100;

// =========================================================================
// 1. PAYMENT INITIATE SOUND (~0.22s subtle, minute futuristic confirmation blip)
// =========================================================================
const initDuration = 0.25;
const initSamples = new Float32Array(Math.floor(sampleRate * initDuration));
for (let i = 0; i < initSamples.length; i++) {
  const t = i / sampleRate;
  const attack = Math.min(1, i / (sampleRate * 0.008));
  const decay = Math.exp(-t / 0.08);
  const env = attack * decay;

  const freq = 440 + 440 * Math.sin((t / initDuration) * (Math.PI / 2));
  const wave =
    Math.sin(2 * Math.PI * freq * t) * 0.7 +
    Math.sin(2 * Math.PI * freq * 2 * t) * 0.25 +
    Math.sin(2 * Math.PI * freq * 3 * t) * 0.05;

  initSamples[i] = wave * env * 0.40;
}

// =========================================================================
// 2. PAYMENT SUCCESS SOUND (~3.8s Authentic Google Pay / UPI signature chime)
// Matches the user's uploaded 4-second audio file:
// D5 -> F#5 -> A5 -> D6 -> A6 / D7 celestial chime and lingering crystal reverberation
// =========================================================================
const successDuration = 3.8;
const successSamples = new Float32Array(Math.floor(sampleRate * successDuration));

const successNotes = [
  // Intro melodic sequence
  { start: 0.00, freq: 587.33, duration: 0.55, amp: 0.38 }, // D5
  { start: 0.13, freq: 739.99, duration: 0.65, amp: 0.42 }, // F#5
  { start: 0.26, freq: 880.00, duration: 0.85, amp: 0.46 }, // A5
  { start: 0.42, freq: 1174.66, duration: 2.20, amp: 0.52 }, // D6 (main bell)
  // High celestial chime chord & lingering sparkle (A6, D7, F#7)
  { start: 0.56, freq: 1760.00, duration: 3.10, amp: 0.36 }, // A6
  { start: 0.58, freq: 2349.32, duration: 3.00, amp: 0.28 }, // D7
  { start: 0.62, freq: 2959.96, duration: 2.60, amp: 0.16 }, // F#7
];

for (const note of successNotes) {
  const startIdx = Math.floor(note.start * sampleRate);
  const totalNoteSamples = Math.floor(note.duration * sampleRate);
  for (let i = 0; i < totalNoteSamples; i++) {
    const idx = startIdx + i;
    if (idx >= successSamples.length) break;

    const t = i / sampleRate;
    // Acoustic bell envelope: ultra-fast transient attack (3ms), then exponential ring
    const attack = Math.min(1, i / (sampleRate * 0.003));
    const decay = Math.exp(-t / (note.duration * 0.36));
    const env = attack * decay;

    // Harmonic physical bell model
    const f = note.freq;
    const wave =
      Math.sin(2 * Math.PI * f * t) * 0.58 +
      Math.sin(2 * Math.PI * (f * 2.003) * t) * 0.25 +
      Math.sin(2 * Math.PI * (f * 3.005) * t) * 0.10 +
      Math.sin(2 * Math.PI * (f * 4.22) * t) * 0.04 +
      Math.sin(2 * Math.PI * (f * 5.41) * t) * 0.03;

    successSamples[idx] += wave * env * note.amp;
  }
}

// Metallic bell strike transients
const clinks = [
  { start: 0.01, freq: 3600, amp: 0.15, decay: 0.10 },
  { start: 0.14, freq: 4400, amp: 0.16, decay: 0.12 },
  { start: 0.27, freq: 5200, amp: 0.18, decay: 0.14 },
  { start: 0.43, freq: 6200, amp: 0.20, decay: 0.22 },
  { start: 0.57, freq: 7400, amp: 0.15, decay: 0.28 },
];
for (const c of clinks) {
  const startIdx = Math.floor(c.start * sampleRate);
  const total = Math.floor(c.decay * sampleRate);
  for (let i = 0; i < total; i++) {
    const idx = startIdx + i;
    if (idx >= successSamples.length) break;
    const t = i / sampleRate;
    const env = Math.exp(-t / (c.decay * 0.22));
    const hit = Math.sin(2 * Math.PI * c.freq * t);
    successSamples[idx] += hit * env * c.amp;
  }
}

// Normalize success
let maxSucc = 0;
for (let i = 0; i < successSamples.length; i++) {
  if (Math.abs(successSamples[i]) > maxSucc) maxSucc = Math.abs(successSamples[i]);
}
if (maxSucc > 0) {
  for (let i = 0; i < successSamples.length; i++) {
    successSamples[i] = (successSamples[i] / maxSucc) * 0.95;
  }
}

// =========================================================================
// 3. PAYMENT FAILURE SOUND (~1.2s descending error buzzer)
// =========================================================================
const failDuration = 1.25;
const failSamples = new Float32Array(Math.floor(sampleRate * failDuration));

// Tone 1: 0.0s to 0.24s (low-mid error buzz ~290Hz down to ~220Hz)
const t1Len = Math.floor(0.24 * sampleRate);
for (let i = 0; i < t1Len; i++) {
  const t = i / sampleRate;
  const attack = Math.min(1, i / (sampleRate * 0.005));
  const decay = Math.exp(-t / 0.14);
  const env = attack * decay;
  const freq = 290 - t * 250;
  const wave =
    Math.sin(2 * Math.PI * freq * t) * 0.55 +
    Math.sin(2 * Math.PI * freq * 2 * t) * 0.25 +
    Math.sin(2 * Math.PI * freq * 3 * t) * 0.15 +
    Math.sin(2 * Math.PI * freq * 4 * t) * 0.05;
  failSamples[i] += wave * env * 0.75;
}

// Tone 2: 0.28s to 1.15s (deep resonant decline thud ~165Hz down to ~80Hz)
const t2Start = Math.floor(0.28 * sampleRate);
const t2Len = Math.floor(0.85 * sampleRate);
for (let i = 0; i < t2Len; i++) {
  const idx = t2Start + i;
  if (idx >= failSamples.length) break;
  const t = i / sampleRate;
  const attack = Math.min(1, i / (sampleRate * 0.008));
  const decay = Math.exp(-t / 0.35);
  const env = attack * decay;
  const freq = 165 - t * 95;
  const wave =
    Math.sin(2 * Math.PI * freq * t) * 0.55 +
    Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.30 +
    Math.sin(2 * Math.PI * freq * 2 * t) * 0.15;
  failSamples[idx] += wave * env * 0.85;
}

// Normalize failure
let maxFail = 0;
for (let i = 0; i < failSamples.length; i++) {
  if (Math.abs(failSamples[i]) > maxFail) maxFail = Math.abs(failSamples[i]);
}
if (maxFail > 0) {
  for (let i = 0; i < failSamples.length; i++) {
    failSamples[i] = (failSamples[i] / maxFail) * 0.92;
  }
}

// Write files to public/sounds and dist/sounds
const soundsDir = path.join(__dirname, '..', 'public', 'sounds');
const distSoundsDir = path.join(__dirname, '..', 'dist', 'sounds');
[soundsDir, distSoundsDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const initWav = createWavBuffer(initSamples, sampleRate);
const successWav = createWavBuffer(successSamples, sampleRate);
const failWav = createWavBuffer(failSamples, sampleRate);

fs.writeFileSync(path.join(soundsDir, 'payment-initiate.wav'), initWav);
fs.writeFileSync(path.join(soundsDir, 'payment-success.wav'), successWav);
fs.writeFileSync(path.join(soundsDir, 'payment-failure.wav'), failWav);

fs.writeFileSync(path.join(distSoundsDir, 'payment-initiate.wav'), initWav);
fs.writeFileSync(path.join(distSoundsDir, 'payment-success.wav'), successWav);
fs.writeFileSync(path.join(distSoundsDir, 'payment-failure.wav'), failWav);

// Generate TypeScript constants with base64 for failsafe offline embedded audio
const b64Init = initWav.toString('base64');
const b64Success = successWav.toString('base64');
const b64Fail = failWav.toString('base64');

const dataUrisFile = path.join(__dirname, '..', 'src', 'services', 'soundAssets.ts');
const tsContent = `// Auto-generated Base64 Audio assets for instant zero-latency playback
export const SOUND_DATA_URIS = {
  initiate: 'data:audio/wav;base64,${b64Init}',
  success: 'data:audio/wav;base64,${b64Success}',
  failure: 'data:audio/wav;base64,${b64Fail}',
};
`;

fs.writeFileSync(dataUrisFile, tsContent);
console.log('Audio files and soundAssets.ts generated successfully!');
