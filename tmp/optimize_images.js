const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = 'c:/Users/santh/OneDrive - WisRight Technologies Private Limited/Pictures/Kottravai__1-main/Kottravai__1-main/public';
const imagesToOptimize = [
  'Picture1.png',
  'Picture2.png',
  'Picture3.png',
  'Picture4.png',
  'Picture5.png',
  '4.png',
  'coconut-banner.png',
  'whatsapp-banner.png'
];

async function optimize() {
  console.log('Starting image optimization...');
  for (const img of imagesToOptimize) {
    const inputPath = path.join(publicDir, img);
    const outputPath = path.join(publicDir, img.replace(/\.(png|jpg|jpeg)$/, '.webp'));
    
    if (fs.existsSync(inputPath)) {
      console.log(`Optimizing ${img}...`);
      await sharp(inputPath)
        .resize(1200, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);
      console.log(`Created ${path.basename(outputPath)}`);
    } else {
      console.log(`File not found: ${inputPath}`);
    }
  }
  console.log('Optimization complete!');
}

optimize().catch(err => {
  console.error('Error during optimization:', err);
  process.exit(1);
});
