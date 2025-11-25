import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';
import { getFileUrl } from './src/middleware/cloudinary';
import axios from 'axios';
import fs from 'fs';

async function verifyUpload() {
    try {
        // 1. Create dummy file
        fs.writeFileSync('test_upload.txt', 'Hello Cloudinary');

        // 2. Upload
        console.log('Uploading file...');
        const result = await cloudinary.uploader.upload('test_upload.txt', {
            folder: 'classuploads',
            resource_type: 'auto',
            type: 'authenticated' // Explicitly upload as authenticated
        });

        console.log('Upload successful!');
        console.log('Public ID:', result.public_id);
        console.log('Version:', result.version);
        console.log('Secure URL:', result.secure_url);

        // 3. Generate Signed URL
        const signedUrl = getFileUrl(result.public_id, result.format, result.version.toString());
        console.log('Signed URL:', signedUrl);

        // 4. Fetch
        console.log('Fetching signed URL...');
        const response = await axios.get(signedUrl);
        console.log('✅ Fetch successful! Status:', response.status);

        // Cleanup
        await cloudinary.uploader.destroy(result.public_id);
        fs.unlinkSync('test_upload.txt');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.log('Response Status:', error.response.status);
        }
    }
}

verifyUpload();
