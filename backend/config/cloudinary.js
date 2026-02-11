import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configurazione Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage per le immagini dei prodotti
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lucanikoshop/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [
      { 
        width: 1200, 
        height: 1200, 
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto' // WebP automatico quando supportato
      }
    ],
  },
});

// Storage per gli avatar utenti
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lucanikoshop/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [
      { 
        width: 500, 
        height: 500, 
        crop: 'fill',
        quality: 'auto:good',
        fetch_format: 'auto',
        gravity: 'face' // Focus sul viso per avatar
      }
    ],
  },
});

// Multer upload middleware
export const uploadProduct = multer({ storage: productStorage });
export const uploadAvatar = multer({ storage: avatarStorage });

export default cloudinary;