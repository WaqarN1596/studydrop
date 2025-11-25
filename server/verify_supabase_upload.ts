import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    console.log('Testing upload to "class-uploads" bucket...');
    console.log('Using Key (first 10 chars):', supabaseKey?.substring(0, 10) + '...');

    const jwtParts = supabaseKey.split('.');
    if (jwtParts.length > 1) {
        try {
            const payload = JSON.parse(atob(jwtParts[1]));
            console.log('JWT Role:', payload.role);
        } catch (e) {
            console.log('Could not decode JWT role');
        }
    }

    // List buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error('❌ Failed to list buckets:', listError.message);
    } else {
        console.log('Buckets found:', buckets.map(b => b.name));
    }

    const fileName = `test-upload-${Date.now()}.txt`;
    const fileContent = 'This is a test file to verify Supabase Storage permissions.';

    const { data, error } = await supabase
        .storage
        .from('StudyDrop')
        .upload(fileName, fileContent, {
            contentType: 'text/plain'
        });

    if (error) {
        console.error('❌ Upload failed:', error.message);
        console.error('Error details:', error);
    } else {
        console.log('✅ Upload successful!');
        console.log('Path:', data.path);

        // Clean up
        console.log('Deleting test file...');
        const { error: delError } = await supabase
            .storage
            .from('StudyDrop')
            .remove([fileName]);

        if (delError) console.error('Failed to delete test file:', delError.message);
        else console.log('Test file deleted.');
    }
}

testUpload();
