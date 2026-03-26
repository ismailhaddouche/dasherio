import { Request, Response } from 'express';
import multer from 'multer';
import * as ImageService from '../services/image.service';

// Filter for only allow specific image types
const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  // Also validate file extension as additional security
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE'), false);
  }
};

const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Max 10MB
});

export async function uploadDishImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'NO_FILE_UPLOADED' });
      return;
    }
    const publicUrl = await ImageService.processAndSaveImage(req.file, 'dishes');
    res.status(201).json({ url: publicUrl });
  } catch (err: any) {
    if (err.message === 'INVALID_FILE_TYPE') {
      res.status(400).json({ error: 'FILE_TYPE_NOT_SUPPORTED' });
    } else if (err.message.includes('unsupported image')) {
      res.status(400).json({ error: 'INVALID_IMAGE_FORMAT' });
    } else {
      res.status(500).json({ error: 'Error processing image' });
    }
  }
}

export async function uploadCategoryImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'NO_FILE_UPLOADED' });
      return;
    }
    const publicUrl = await ImageService.processAndSaveImage(req.file, 'categories');
    res.status(201).json({ url: publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: 'Error processing image' });
  }
}

export async function uploadRestaurantLogo(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'NO_FILE_UPLOADED' });
      return;
    }
    const publicUrl = await ImageService.processAndSaveImage(req.file, 'restaurants');
    res.status(201).json({ url: publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: 'Error processing image' });
  }
}
