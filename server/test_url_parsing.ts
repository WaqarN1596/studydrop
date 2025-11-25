
const urls = [
    'https://res.cloudinary.com/dmc4238do/image/upload/v1764100201/classuploads/1764100201649-Comp%201.pdf',
    'https://res.cloudinary.com/dmc4238do/raw/upload/v1764103540/classuploads/grwqor4utzb0cqua3kn7.txt'
];

function parseCloudinaryUrl(url: string) {
    try {
        // Regex to capture parts: /resource_type/type/v(version)/public_id
        // Note: public_id might contain slashes and dots
        const regex = /\/([a-z]+)\/([a-z]+)\/v(\d+)\/(.+)$/;
        const matches = url.match(regex);

        if (!matches) {
            console.error('❌ Failed to parse URL:', url);
            return null;
        }

        const resourceType = matches[1];
        const type = matches[2];
        const version = matches[3];
        let publicId = decodeURIComponent(matches[4]);

        // For 'image' resource type, Cloudinary usually strips the extension from the public_id in the URL construction
        // BUT if it's in the URL with extension, we might need to handle it.
        // Actually, for signing, 'image' usually expects public_id WITHOUT extension.
        // 'raw' expects public_id WITH extension.

        // Let's check the extension logic
        if (resourceType === 'image' || resourceType === 'video') {
            // If the publicId has an extension that matches the file format, strip it?
            // The URL has .../file.pdf
            // The public_id for signing should be .../file
            const lastDotIndex = publicId.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                publicId = publicId.substring(0, lastDotIndex);
            }
        }

        return {
            resourceType,
            type,
            version,
            publicId
        };
    } catch (e) {
        console.error('Error parsing URL:', e);
        return null;
    }
}

urls.forEach(url => {
    console.log('---');
    console.log('URL:', url);
    const parsed = parseCloudinaryUrl(url);
    console.log('Parsed:', parsed);
});
