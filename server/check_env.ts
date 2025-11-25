import dotenv from 'dotenv';
dotenv.config();

console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key Present:', !!process.env.CLOUDINARY_API_KEY);
console.log('API Secret Present:', !!process.env.CLOUDINARY_API_SECRET);
