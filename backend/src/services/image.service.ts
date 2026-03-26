import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = '/app/uploads';

// Ensure directory exists (in local it might be different, but in Docker it's /app/uploads)
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function processAndSaveImage(file: Express.Multer.File, folder: 'dishes' | 'restaurants' | 'categories'): Promise<string> {
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  const relativePath = `${folder}/${fileName}`;
  const fullPath = path.join(UPLOADS_DIR, relativePath);

  // Ensure subfolder exists
  const subFolderDir = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(subFolderDir)) {
    fs.mkdirSync(subFolderDir, { recursive: true });
  }

  // OPTIMIZATION: Resize, auto-orient, and convert to WebP
  await sharp(file.buffer)
    .rotate() // Respect EXIF orientation (mobile photos)
    .resize(1200, null, { withoutEnlargement: true }) // Max 1200px width
    .webp({ quality: 80 }) // Efficient format
    .toFile(fullPath);

  return `/uploads/${relativePath}`; // The public URL that Caddy will serve
}
