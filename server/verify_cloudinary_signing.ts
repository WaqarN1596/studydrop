import { getFileUrl } from './src/middleware/cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key Present:', !!process.env.CLOUDINARY_API_KEY);
console.log('API Secret Present:', !!process.env.CLOUDINARY_API_SECRET);

const originalUrl = 'https://res.cloudinary.com/dmc4238do/image/upload/v1764100201/classuploads/1764100201649-Comp%201.pdf';

async function verifySigning() {
    console.log('Original URL:', originalUrl);

    // 0. Test Fetching Original URL
    try {
        console.log('Attempting to fetch ORIGINAL URL...');
        const response = await axios.get(originalUrl, { responseType: 'stream' });
        console.log('✅ Original URL Fetch successful! Status:', response.status);
    } catch (error: any) {
        console.error('❌ Original URL Fetch failed:', error.message);
        if (error.response) {
            console.log('Response Status:', error.response.status);
            console.log('Response Headers:', error.response.headers);
        }
    }

    // 1. Test Regex Extraction
    const matches = originalUrl.match(/classuploads\/[^.]+/);
    if (!matches) {
        console.error('❌ Regex failed to extract public ID');
        return;
    }
    const publicId = decodeURIComponent(matches[0]);
    console.log('Extracted Public ID:', publicId);

    const versionMatch = originalUrl.match(/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : undefined;
    console.log('Extracted Version:', version);

    // 2. Inspect Resource via Admin API
    try {
        console.log('Inspecting resource via Admin API...');
        const resource = await cloudinary.api.resource(publicId, { resource_type: 'image', type: 'authenticated' });
        console.log('Resource Details:', JSON.stringify(resource, null, 2));
    } catch (error: any) {
        console.error('❌ Admin API failed (authenticated):', error.message);
        // Try finding it as 'upload' type if authenticated fails
        try {
            console.log('Retrying as type: upload...');
            const resource = await cloudinary.api.resource(publicId, { resource_type: 'image', type: 'upload' });
            console.log('Resource Details (upload):', JSON.stringify(resource, null, 2));
        } catch (err: any) {
            console.error('❌ Admin API retry failed (upload):', err.message);

            // Try 'raw' type with extension
            try {
                console.log('Retrying as type: raw (authenticated) with extension...');
                const rawPublicId = publicId + '.pdf';
                const resource = await cloudinary.api.resource(rawPublicId, { resource_type: 'raw', type: 'authenticated' });
                console.log('Resource Details (raw):', JSON.stringify(resource, null, 2));
            } catch (rawErr: any) {
                console.error('❌ Admin API retry failed (raw):', rawErr.message);
            }
        }
    }

    // 3. Generate Signed URL
    try {
        const signedUrl = getFileUrl(publicId, 'pdf', version);
        console.log('Signed URL:', signedUrl);

        // Check if URL contains signature
        if (!signedUrl.includes('s--')) {
            console.error('❌ URL does not contain signature!');
        }

        // 4. Test Fetching
        console.log('Attempting to fetch signed URL...');
        const response = await axios.get(signedUrl, { responseType: 'stream' });
        console.log('✅ Fetch successful! Status:', response.status);
        console.log('Headers:', response.headers);
    } catch (error: any) {
        console.error('❌ Fetch failed:', error.message);
        if (error.response) {
            console.log('Response Status:', error.response.status);
            console.log('Response Headers:', error.response.headers);
        }
    }

    // 5. List Resources in Folder
    try {
        console.log('Listing resources in "classuploads" folder...');
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'classuploads/',
            max_results: 10
        });
        console.log('Resources (upload):', JSON.stringify(result.resources, null, 2));

        const resultAuth = await cloudinary.api.resources({
            type: 'authenticated',
            prefix: 'classuploads/',
            max_results: 10
        });
        console.log('Resources (authenticated):', JSON.stringify(resultAuth.resources, null, 2));

    } catch (error: any) {
        console.error('❌ List resources failed:', error.message);
    }
}

verifySigning();
