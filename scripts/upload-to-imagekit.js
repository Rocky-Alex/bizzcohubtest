const fs = require('fs');
const path = require('path');

// ImageKit configuration
const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
const IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

const imagesToUpload = [
    'product-1.jpg',
    'product-2.jpg',
    'category-laptops.jpg',
    'MacBook Pro.jpg',
    'category-accessories.jpg',
    'gaming-laptop.png',
    'placeholder.jpg'
];

async function uploadToImageKit(filePath, fileName) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const base64File = fileBuffer.toString('base64');

        const response = await fetch('http://localhost:3001/api/imagekit/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                file: `data:image/jpeg;base64,${base64File}`,
                fileName: fileName,
                folder: '/landing-page'
            })
        });

        const data = await response.json();
        if (data.url) {
            console.log(`✅ Uploaded: ${fileName} -> ${data.url}`);
            return data.url;
        } else {
            console.error(`❌ Failed to upload: ${fileName}`, data);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error uploading ${fileName}:`, error.message);
        return null;
    }
}

async function main() {
    console.log('🚀 Starting ImageKit upload...\n');

    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    const results = {};

    for (const imageName of imagesToUpload) {
        const imagePath = path.join(uploadsDir, imageName);

        if (fs.existsSync(imagePath)) {
            const url = await uploadToImageKit(imagePath, imageName);
            if (url) {
                results[imageName] = url;
            }
        } else {
            console.log(`⚠️  File not found: ${imageName}`);
        }
    }

    console.log('\n📋 Upload Results:');
    console.log(JSON.stringify(results, null, 2));

    // Save results to a file
    fs.writeFileSync(
        path.join(__dirname, 'imagekit-urls.json'),
        JSON.stringify(results, null, 2)
    );
    console.log('\n✅ Results saved to scripts/imagekit-urls.json');
}

main();
