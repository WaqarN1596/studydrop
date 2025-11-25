import dotenv from 'dotenv';
import path from 'path';

// Load env vars explicitly from server root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('DEBUG: SUPABASE_URL:', process.env.SUPABASE_URL ? 'Found' : 'Missing');
console.log('DEBUG: SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Missing');

import { supabase, BUCKET_NAME } from '../src/middleware/supabase';
import { query, queryAll } from '../src/db/postgres';
import axios from 'axios';
import { getSignedUrlFromPublicUrl } from '../src/middleware/cloudinary';

async function migrate() {
    console.log('🚀 Starting migration from Cloudinary to Supabase...');

    // 1. Ensure Bucket Exists
    console.log(`Checking bucket: ${BUCKET_NAME}...`);
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
        console.error('❌ Failed to list buckets:', bucketError.message);
        process.exit(1);
    }

    const bucketExists = buckets.find(b => b.name === BUCKET_NAME);
    if (!bucketExists) {
        console.log(`Bucket '${BUCKET_NAME}' not found. Creating...`);
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: false,
            fileSizeLimit: 52428800, // 50MB
        });
        if (createError) {
            console.error('❌ Failed to create bucket:', createError.message);
            console.log('⚠️ Proceeding with migration anyway (assuming bucket might exist but is hidden by RLS)...');
            // Do not exit, try to upload
        } else {
            console.log('✅ Bucket created successfully.');
        }
    } else {
        console.log('✅ Bucket exists.');
    }

    // 2. Fetch Cloudinary Uploads
    console.log('Fetching uploads from database...');
    // Select uploads where file_path contains 'cloudinary'
    const uploads = await queryAll(`
        SELECT * FROM uploads 
        WHERE file_path LIKE '%cloudinary%'
    `);

    console.log(`Found ${uploads.length} files to migrate.`);

    let successCount = 0;
    let failCount = 0;

    for (const upload of uploads) {
        try {
            console.log(`\nMigrating Upload ID: ${upload.id} (${upload.original_filename})...`);

            // Determine the source URL
            let sourceUrl = upload.file_path;

            // If it's a raw Cloudinary URL, we might need to sign it to download it
            // Use our helper to get a signed URL for downloading
            if (sourceUrl && sourceUrl.includes('cloudinary')) {
                sourceUrl = getSignedUrlFromPublicUrl(sourceUrl);
            }

            console.log('Downloading from:', sourceUrl);

            // Download file
            let response;
            try {
                response = await axios.get(sourceUrl, { responseType: 'arraybuffer' });
            } catch (err) {
                // Fallback: If it's a 'demo' URL, try accessing it as public 'upload' instead of 'authenticated'
                if (sourceUrl.includes('/demo/') && sourceUrl.includes('/authenticated/')) {
                    console.log('⚠️ Download failed. Trying public URL fallback for demo file...');
                    // Construct public URL: replace /authenticated/ with /upload/ and remove signature (if any)
                    // Actually, just use the raw parts.
                    // Regex to strip signature: /s--...--/
                    let publicUrl = sourceUrl.replace(/\/s--[^/]+--/, '').replace('/authenticated/', '/upload/');
                    console.log('Fallback URL:', publicUrl);
                    response = await axios.get(publicUrl, { responseType: 'arraybuffer' });
                } else {
                    throw err;
                }
            }

            const fileBuffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || upload.mime_type;

            // Generate new Supabase path
            // Format: userId/timestamp-filename
            const timestamp = Date.now();
            const cleanFileName = upload.original_filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const newPath = `${upload.user_id}/${timestamp}-${cleanFileName}`;

            // Upload to Supabase
            const { error: uploadError } = await supabase
                .storage
                .from(BUCKET_NAME)
                .upload(newPath, fileBuffer, {
                    contentType: contentType,
                    upsert: true
                });

            if (uploadError) {
                throw new Error(`Supabase upload failed: ${uploadError.message}`);
            }

            // Update Database
            await query(
                `UPDATE uploads SET file_path = $1 WHERE id = $2`,
                [newPath, upload.id]
            );

            console.log(`✅ Migrated to: ${newPath}`);
            successCount++;

        } catch (error: any) {
            console.error(`❌ Failed to migrate upload ${upload.id}:`, error.message);
            failCount++;
        }
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Total: ${uploads.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);

    if (failCount > 0) {
        console.log('⚠️ Some files failed. Check logs.');
    } else {
        console.log('🎉 All files migrated successfully!');
    }
}

migrate().catch(console.error);
