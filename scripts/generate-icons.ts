import fs from "fs";
import path from "path";
import sharp from "sharp";

// Ensure public directories exist
const publicDir = path.join(process.cwd(), "public");
const iconsDir = path.join(publicDir, "icons");

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

/**
 * Generates the SVG string for FitCoach AI icon
 * @param isMaskable If true, renders full bleed (no rounded corners) and fills 100%
 */
function createFitCoachSvg(isMaskable = false): string {
  const bgShape = isMaskable
    ? `<rect width="512" height="512" fill="url(#bgGrad)"/>`
    : `<rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Vibrant RPG Green Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#043927" />
      <stop offset="45%" stop-color="#059669" />
      <stop offset="100%" stop-color="#06C755" />
    </linearGradient>

    <!-- Inner Radial Glow -->
    <radialGradient id="glowGrad" cx="50%" cy="48%" r="45%">
      <stop offset="0%" stop-color="#34D399" stop-opacity="0.35" />
      <stop offset="60%" stop-color="#10B981" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#043927" stop-opacity="0" />
    </radialGradient>

    <!-- Drop Shadow for Icon Elements -->
    <filter id="shadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#022c1e" flood-opacity="0.55" />
    </filter>
  </defs>

  <!-- Background Base -->
  ${bgShape}

  <!-- Ambient RPG Glow -->
  <circle cx="256" cy="250" r="210" fill="url(#glowGrad)" />

  <!-- Main Emblem Group with Shadow -->
  <g filter="url(#shadow)">
    <!-- RPG Level-Up Chevrons (Top & Center) -->
    <!-- Top Chevron -->
    <path d="M 256 96 L 332 168 L 302 168 L 256 124 L 210 168 L 180 168 Z" fill="#FFFFFF" />
    
    <!-- Middle Chevron -->
    <path d="M 256 156 L 332 228 L 302 228 L 256 184 L 210 228 L 180 228 Z" fill="#FFFFFF" opacity="0.95" />

    <!-- Fitness Dumbbell (Horizontal Heavy Iron Core) -->
    <!-- Center Grip Bar -->
    <rect x="176" y="296" width="160" height="28" rx="14" fill="#FFFFFF" />
    
    <!-- Left Weight Plates -->
    <!-- Inner Left -->
    <rect x="142" y="232" width="28" height="156" rx="12" fill="#FFFFFF" />
    <!-- Outer Left -->
    <rect x="104" y="254" width="30" height="112" rx="10" fill="#FFFFFF" opacity="0.95" />

    <!-- Right Weight Plates -->
    <!-- Inner Right -->
    <rect x="342" y="232" width="28" height="156" rx="12" fill="#FFFFFF" />
    <!-- Outer Right -->
    <rect x="378" y="254" width="30" height="112" rx="10" fill="#FFFFFF" opacity="0.95" />

    <!-- Central Accent Diamond (Level Up Core) -->
    <polygon points="256,278 274,310 256,342 238,310" fill="#059669" />
    <polygon points="256,286 268,310 256,334 244,310" fill="#34D399" />

    <!-- RPG Sparkle Stars -->
    <!-- Sparkle Top-Right (Main) -->
    <path d="M 382 108 Q 382 136 410 136 Q 382 136 382 164 Q 382 136 354 136 Q 382 136 382 108 Z" fill="#FFFFFF" />
    <circle cx="382" cy="136" r="3.5" fill="#34D399" />

    <!-- Sparkle Left-Top (Secondary) -->
    <path d="M 132 128 Q 132 148 152 148 Q 132 148 132 168 Q 132 148 112 148 Q 132 148 132 128 Z" fill="#FFFFFF" opacity="0.9" />

    <!-- Small Accent Sparkle (Bottom Right) -->
    <path d="M 390 388 Q 390 402 404 402 Q 390 402 390 416 Q 390 402 376 402 Q 390 402 390 388 Z" fill="#FFFFFF" opacity="0.85" />
  </g>
</svg>`;
}

async function main() {
  console.log("Generating FitCoach AI PWA Icons...");

  const standardSvg = createFitCoachSvg(false);
  const maskableSvg = createFitCoachSvg(true);

  // 1. Save SVGs
  const standardSvgPath = path.join(iconsDir, "icon.svg");
  const maskableSvgPath = path.join(iconsDir, "icon-maskable.svg");
  const faviconSvgPath = path.join(publicDir, "favicon.svg");

  fs.writeFileSync(standardSvgPath, standardSvg, "utf8");
  fs.writeFileSync(maskableSvgPath, maskableSvg, "utf8");
  fs.writeFileSync(faviconSvgPath, standardSvg, "utf8");
  console.log("✓ Saved SVGs");

  // 2. Generate PNGs using sharp
  // icon-192.png
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192.png"));
  console.log("✓ Generated icon-192.png");

  // icon-512.png
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-512.png"));
  console.log("✓ Generated icon-512.png");

  // icon-maskable-512.png
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-512.png"));
  console.log("✓ Generated icon-maskable-512.png");

  // apple-touch-icon.png (180x180 solid background)
  // Apple requires solid background (no transparency on corners)
  await sharp(Buffer.from(maskableSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));
  // Also copy to root public/ for standard apple devices requesting /apple-touch-icon.png
  await sharp(Buffer.from(maskableSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("✓ Generated apple-touch-icon.png (180x180)");

  // favicon.png (48x48)
  await sharp(Buffer.from(standardSvg))
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, "favicon.png"));
  console.log("✓ Generated favicon.png");

  console.log("All icons generated successfully!");
}

main().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
