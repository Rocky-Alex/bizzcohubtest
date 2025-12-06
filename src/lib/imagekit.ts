import ImageKit from 'imagekit';

// Initialize ImageKit
export const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
});

// Helper function to upload image to ImageKit
export async function uploadToImageKit(
    file: string, // base64 string
    fileName: string,
    folder: string = 'products'
): Promise<{ url: string; fileId: string }> {
    try {
        const result = await imagekit.upload({
            file: file, // base64 string
            fileName: fileName,
            folder: folder,
            useUniqueFileName: true,
        });

        return {
            url: result.url,
            fileId: result.fileId,
        };
    } catch (error) {
        console.error('ImageKit upload error:', error);
        throw new Error('Failed to upload image to ImageKit');
    }
}

// Helper function to delete image from ImageKit
export async function deleteFromImageKit(fileId: string): Promise<void> {
    try {
        await imagekit.deleteFile(fileId);
    } catch (error) {
        console.error('ImageKit delete error:', error);
        throw new Error('Failed to delete image from ImageKit');
    }
}

// Helper function to get authentication parameters for client-side upload
export function getImageKitAuthParams() {
    const authenticationEndpoint = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/imagekit/auth`;
    return {
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
        urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
        authenticationEndpoint,
    };
}
