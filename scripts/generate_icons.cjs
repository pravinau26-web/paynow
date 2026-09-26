const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Master SVG for Super Pay logo (512x512)
const superPaySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#140D36" />
      <stop offset="50%" stop-color="#0E0826" />
      <stop offset="100%" stop-color="#070414" />
    </linearGradient>

    <!-- Border Glow Gradient -->
    <linearGradient id="borderGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A855F7" />
      <stop offset="50%" stop-color="#5B3DF5" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>

    <!-- Aura Glow Radial -->
    <radialGradient id="auraGlow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.65" />
      <stop offset="60%" stop-color="#5B3DF5" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#0E0826" stop-opacity="0" />
    </radialGradient>

    <!-- S Upper Arc Gradient -->
    <linearGradient id="sTopGrad" x1="0%" y1="0%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="50%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>

    <!-- Lightning Bolt Gradient -->
    <linearGradient id="boltGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFF9D2" />
      <stop offset="35%" stop-color="#FFE600" />
      <stop offset="70%" stop-color="#FF9900" />
      <stop offset="100%" stop-color="#FF5500" />
    </linearGradient>

    <!-- S Bottom Arc Gradient -->
    <linearGradient id="sBottomGrad" x1="0%" y1="50%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6" />
      <stop offset="50%" stop-color="#D946EF" />
      <stop offset="100%" stop-color="#EC4899" />
    </linearGradient>

    <!-- Pay Arrow Gradient -->
    <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F5D4" />
      <stop offset="100%" stop-color="#00BBF9" />
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="shadowBolt" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#FF9900" flood-opacity="0.65" />
    </filter>
    <filter id="shadowS" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#5B3DF5" flood-opacity="0.75" />
    </filter>
    <filter id="glowSpark" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#00F0FF" flood-opacity="0.9" />
    </filter>
  </defs>

  <!-- Squircle Base -->
  <rect x="16" y="16" width="480" height="480" rx="112" ry="112" fill="url(#bgGrad)" />
  <rect x="16" y="16" width="480" height="480" rx="112" ry="112" fill="url(#auraGlow)" />
  <rect x="16" y="16" width="480" height="480" rx="112" ry="112" fill="none" stroke="url(#borderGlow)" stroke-width="6" opacity="0.75" />

  <!-- Inner Soft Bevel Highlight -->
  <rect x="22" y="22" width="468" height="468" rx="106" ry="106" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.15" />

  <!-- SUPER PAY SYMBOL GROUP -->
  <g filter="url(#shadowS)" transform="translate(0, -6)">
    <!-- Top Arc of 'S' -->
    <path d="M 334 142 C 308 116, 260 112, 214 122 C 160 134, 126 172, 138 214 C 146 242, 172 260, 214 274 L 272 292 C 304 302, 320 314, 316 332 C 310 354, 276 372, 234 370 C 188 368, 154 340, 142 308" 
          fill="none" 
          stroke="url(#sTopGrad)" 
          stroke-width="44" 
          stroke-linecap="round" 
          stroke-linejoin="round" />

    <!-- Bottom Flow of 'S' -->
    <path d="M 214 274 L 272 292 C 318 306, 344 326, 338 356 C 330 394, 286 414, 232 414 C 172 414, 132 382, 118 338" 
          fill="none" 
          stroke="url(#sBottomGrad)" 
          stroke-width="44" 
          stroke-linecap="round" 
          stroke-linejoin="round" />

    <!-- Central Super Lightning Bolt / Pay Surge -->
    <g filter="url(#shadowBolt)">
      <polygon points="286,96 172,260 252,260 216,420 354,234 272,234" 
               fill="url(#boltGrad)" />
      <!-- Inner Lightning Core Glow -->
      <polygon points="280,126 198,246 256,246 230,370 326,248 268,248" 
               fill="#FFFFFF" 
               opacity="0.85" />
    </g>
  </g>

  <!-- Dynamic Star Sparkles (Super Energy) -->
  <g filter="url(#glowSpark)">
    <!-- Sparkle Top-Right -->
    <path d="M 388 120 Q 388 140 408 140 Q 388 140 388 160 Q 388 140 368 140 Q 388 140 388 120 Z" fill="#00F0FF" />
    <circle cx="388" cy="140" r="3" fill="#FFFFFF" />

    <!-- Sparkle Bottom-Left -->
    <path d="M 112 376 Q 112 388 124 388 Q 112 388 112 400 Q 112 388 100 388 Q 112 388 112 376 Z" fill="#FFD700" />
  </g>

  <!-- Subtle 'SUPER PAY' brand badge text on bottom curved banner -->
  <g opacity="0.95">
    <rect x="146" y="438" width="220" height="34" rx="17" fill="#1C1444" stroke="#8B5CF6" stroke-width="1.5" />
    <text x="256" y="461" 
          font-family="system-ui, -apple-system, sans-serif" 
          font-size="14" 
          font-weight="900" 
          letter-spacing="3" 
          fill="#FFFFFF" 
          text-anchor="middle">SUPER PAY</text>
  </g>
</svg>`;

// Maskable SVG with safe 15% inner padding
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="mBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#140D36" />
      <stop offset="50%" stop-color="#0E0826" />
      <stop offset="100%" stop-color="#070414" />
    </linearGradient>
    <radialGradient id="mAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.65" />
      <stop offset="100%" stop-color="#0E0826" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="mS" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="50%" stop-color="#8B5CF6" />
      <stop offset="100%" stop-color="#EC4899" />
    </linearGradient>
    <linearGradient id="mBolt" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF9D2" />
      <stop offset="40%" stop-color="#FFE600" />
      <stop offset="100%" stop-color="#FF5500" />
    </linearGradient>
    <filter id="mGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#5B3DF5" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- Full bleed background for adaptive icon masking -->
  <rect width="512" height="512" fill="url(#mBg)" />
  <rect width="512" height="512" fill="url(#mAura)" />

  <!-- Center Content scaled inside 80% safe zone (center 400x400) -->
  <g transform="translate(51, 46) scale(0.8)" filter="url(#mGlow)">
    <path d="M 334 142 C 308 116, 260 112, 214 122 C 160 134, 126 172, 138 214 C 146 242, 172 260, 214 274 L 272 292 C 304 302, 320 314, 316 332 C 310 354, 276 372, 234 370 C 188 368, 154 340, 142 308" 
          fill="none" 
          stroke="url(#mS)" 
          stroke-width="48" 
          stroke-linecap="round" 
          stroke-linejoin="round" />
    <path d="M 214 274 L 272 292 C 318 306, 344 326, 338 356 C 330 394, 286 414, 232 414 C 172 414, 132 382, 118 338" 
          fill="none" 
          stroke="url(#mS)" 
          stroke-width="48" 
          stroke-linecap="round" 
          stroke-linejoin="round" />

    <polygon points="286,96 172,260 252,260 216,420 354,234 272,234" 
             fill="url(#mBolt)" />
    <polygon points="280,126 198,246 256,246 230,370 326,248 268,248" 
             fill="#FFFFFF" 
             opacity="0.85" />
  </g>
</svg>`;

async function run() {
  console.log('Generating Super Pay icons & assets...');

  // 1. Write favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), superPaySvg.trim());
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), superPaySvg.trim());

  const svgBuffer = Buffer.from(superPaySvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // 2. Generate 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ icon-512.png');

  // 3. Generate 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ icon-192.png');

  // 4. Generate Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  // 5. Generate Favicon 32x32 & 16x16
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico')); // Standard 48x48 PNG fallback as favicon.ico
  console.log('✓ favicon PNGs & favicon.ico');

  // 6. Generate Maskable Icons (192 and 512)
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  await sharp(maskableBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-192.png'));
  console.log('✓ icon-maskable-512.png & icon-maskable-192.png');

  console.log('All Super Pay icons generated successfully!');
}

run().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
