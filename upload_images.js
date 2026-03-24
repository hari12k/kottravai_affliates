const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const mime = require('mime-types'); // Need to map extensions to mime types if we have it, else we can guess or use a basic map
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in server/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Basic mime type guessing to avoid installing extra packages if possible
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.png': return 'image/png';
        case '.webp': return 'image/webp';
        case '.gif': return 'image/gif';
        case '.svg': return 'image/svg+xml';
        default: return 'application/octet-stream';
    }
}

async function uploadFolder(folderPath, bucketName, prefix = '') {
    if (!fs.existsSync(folderPath)) {
        console.error(`❌ Folder not found: ${folderPath}`);
        return;
    }

    const files = fs.readdirSync(folderPath);

    for (const file of files) {
        const fullPath = path.join(folderPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Recursively upload subdirectories
            const newPrefix = path.join(prefix, file).replace(/\\/g, '/');
            await uploadFolder(fullPath, bucketName, newPrefix);
        } else {
            // It's a file, upload it
            const relativePath = path.join(prefix, file).replace(/\\/g, '/'); // Ensure forward slashes for Supabase

            try {
                console.log(`📤 Uploading: ${relativePath}...`);
                const fileBuffer = fs.readFileSync(fullPath);

                const { data, error } = await supabase.storage
                    .from(bucketName)
                    .upload(relativePath, fileBuffer, {
                        contentType: getContentType(fullPath),
                        upsert: true // Overwrite if it already exists
                    });

                if (error) {
                    console.error(`❌ Failed to upload ${relativePath}:`, error.message);
                } else {
                    console.log(`✅ Success: ${relativePath}`);
                }
            } catch (err) {
                console.error(`❌ Error reading or uploading ${relativePath}:`, err.message);
            }
        }
    }
}

// Ensure the user actually passed a folder
const targetFolder = process.argv[2];
const destinationPrefix = process.argv[3] || 'products'; // By default, it will upload into a folder named "products" inside the bucket
const targetBucket = 'products'; // Hardcoded bucket name based on your request

if (!targetFolder) {
    console.log('Usage: node upload_images.js <path/to/local/folder> [destination_folder_name_in_supabase]');
    console.log('Example: node upload_images.js "C:\\Images" "products"');
    console.log('This will upload files from C:\\Images into the "products" bucket under the "products/" folder.');
    process.exit(1);
}

console.log(`🚀 Starting upload to bucket "${targetBucket}", inside the folder "${destinationPrefix}/"...`);
uploadFolder(targetFolder, targetBucket, destinationPrefix).then(() => {
    console.log('🎉 Upload process complete!');
});
