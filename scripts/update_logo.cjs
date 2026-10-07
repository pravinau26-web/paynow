const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function updateLogo() {
  const sourcePath = '/tmp/logo_download.png';
  const publicDir = path.join(__dirname, '..', 'public');

  if (!fs.existsSync(sourcePath)) {
    console.error('Source logo file not found at', sourcePath);
    process.exit(1);
  }

  const inputBuffer = fs.readFileSync(sourcePath);

  // 1. Save standard public/logo.png
  await sharp(inputBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'logo.png'));
  console.log('✓ public/logo.png');

  // 2. Save public/icon-512.png
  await sharp(inputBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ public/icon-512.png');

  // 3. Save public/icon-192.png
  await sharp(inputBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ public/icon-192.png');

  // 4. Save public/apple-touch-icon.png (180x180)
  await sharp(inputBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ public/apple-touch-icon.png');

  // 5. Save Favicon PNGs & ICO
  await sharp(inputBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  await sharp(inputBuffer).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));
  await sharp(inputBuffer).resize(48, 48).png().toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✓ public/favicon PNGs & favicon.ico');

  // 6. Maskable icons (center with 10% padding for safe area)
  const paddedMaskable = await sharp(inputBuffer)
    .resize(410, 410, { fit: 'contain', background: { r: 14, g: 8, b: 38, alpha: 1 } })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 14, g: 8, b: 38, alpha: 1 }
    })
    .png()
    .toBuffer();

  await sharp(paddedMaskable).resize(512, 512).png().toFile(path.join(publicDir, 'icon-maskable-512.png'));
  await sharp(paddedMaskable).resize(192, 192).png().toFile(path.join(publicDir, 'icon-maskable-192.png'));
  console.log('✓ public/icon-maskable-512.png & icon-maskable-192.png');

  // 7. Base64 SVG for logo.svg and favicon.svg
  const base64Png = inputBuffer.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="512" height="512">
  <image width="512" height="512" href="data:image/png;base64,${base64Png}" xlink:href="data:image/png;base64,${base64Png}"/>
</svg>`;

  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent.trim());
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent.trim());
  console.log('✓ public/logo.svg & public/favicon.svg updated with official logo data');

  console.log('All logo assets updated successfully!');
}

updateLogo().catch(err => {
  console.error('Error updating logo:', err);
  process.exit(1);
});
