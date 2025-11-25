import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
    api_key: process.env.CLOUDINARY_API_KEY || 'demo',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'classuploads', // Folder name in Cloudinary
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
        resource_type: 'auto', // Automatically detect resource type
        public_id: (req: any, file: any) => {
            // Generate unique filename: timestamp-originalname
            const timestamp = Date.now();
            const originalName = file.originalname.replace(/\.[^/.]+$/, ''); // Remove extension
            return `${timestamp}-${originalName}`;
        }
    } as any
});

// File filter for validation
const fileFilter = (req: any, file: any, cb: any) => {
    const allowedMimes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, and DOCX are allowed.'), false);
    }
};

// Create multer upload instance with Cloudinary storage
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    },
    fileFilter: fileFilter
});

// Helper to delete file from Cloudinary
export const deleteFile = async (publicId: string) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('File deleted from Cloudinary:', result);
        return result;
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        throw error;
    }
};

// Helper to get file URL
export const getFileUrl = (publicId: string, format?: string, version?: string, resourceType: string = 'image') => {
    return cloudinary.url(publicId, {
        secure: true,
        sign_url: true,
        type: 'authenticated',
        format: format,
        version: version,
        resource_type: resourceType
    });
};

export const getSignedUrlFromPublicUrl = (publicUrl: string) => {
    try {
        // Regex to capture parts: /resource_type/type/v(version)/public_id
        const regex = /\/([a-z]+)\/([a-z]+)\/v(\d+)\/(.+)$/;
        const matches = publicUrl.match(regex);

        if (!matches) {
            console.error('Failed to parse Cloudinary URL:', publicUrl);
            return publicUrl; // Return original if parsing fails
        }

        const resourceType = matches[1];
        // const type = matches[2]; // We force 'authenticated' type for the signed URL
        const version = matches[3];
        let publicId = decodeURIComponent(matches[4]);
        let format: string | undefined = undefined;

        // Handle extension logic
        if (resourceType === 'image' || resourceType === 'video') {
            const lastDotIndex = publicId.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                format = publicId.substring(lastDotIndex + 1);
                publicId = publicId.substring(0, lastDotIndex);
            }
        }

        return getFileUrl(publicId, format, version, resourceType);
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return publicUrl;
    }
};

export default upload;
