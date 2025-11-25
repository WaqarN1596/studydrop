import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
// We use the SERVICE_ROLE_KEY because we need admin access to write to the 'class-uploads' bucket
// and to generate signed URLs for private files.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Supabase Storage will not work.');
}

export const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

export const BUCKET_NAME = 'StudyDrop';

/**
 * Generates a signed URL for a file.
 * Handles both legacy external URLs and new Supabase Storage paths.
 * 
 * @param pathOrUrl - The stored 'url' from the database (either a full URL or a Supabase path)
 * @param expiresIn - Expiration time in seconds (default 3600 = 1 hour)
 */
export const getSignedUrl = async (pathOrUrl: string, expiresIn: number = 3600): Promise<string> => {
    if (!pathOrUrl) return '';

    // Check if it's an external URL (Legacy or Public) - Just return it as is
    if (pathOrUrl.startsWith('http')) {
        return pathOrUrl;
    }

    // Assume it's a Supabase Storage path
    try {
        const { data, error } = await supabase
            .storage
            .from(BUCKET_NAME)
            .createSignedUrl(pathOrUrl, expiresIn);

        if (error) {
            console.error('Error generating Supabase signed URL:', error);
            return pathOrUrl; // Fallback to path (won't work but better than crash)
        }

        return data.signedUrl;
    } catch (err) {
        console.error('Unexpected error generating Supabase signed URL:', err);
        return pathOrUrl;
    }
};
