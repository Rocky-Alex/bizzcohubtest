import ImageKit from 'imagekit';

// Initialize ImageKit with safety check for build time
const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "public_g42DWEqY1R/8z+j7SFlv6KNuLdo=";
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "private_9ALMbOBNb1sNMnb5lt5Pdy1e/WA=";
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/kxci2a0h5";

export const imagekit = (publicKey && privateKey && urlEndpoint)
    ? new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
    })
    : {
        getAuthenticationParameters: () => { throw new Error("ImageKit not configured"); },
        upload: async () => { throw new Error("ImageKit not configured"); },
        deleteFile: async () => { throw new Error("ImageKit not configured"); },
        listFiles: async () => { throw new Error("ImageKit not configured"); },
    } as any;

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
    } catch (error: any) {
        console.error('ImageKit upload error internal:', error);
        throw new Error(`Failed to upload image to ImageKit: ${error.message || JSON.stringify(error)}`);
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

// Helper to extract file ID from URL and delete
export async function deleteFileByUrl(url: string): Promise<boolean> {
    try {
        if (!url || !url.includes('ik.imagekit.io')) return false;

        // Extract filename from URL
        // Example: https://ik.imagekit.io/kxci2a0h5/users/avatars/filename.jpg
        const parts = url.split('/');
        const fileName = parts[parts.length - 1];

        if (!fileName) return false;

        // Search for file by name
        const files = await imagekit.listFiles({
            searchQuery: `name="${fileName}"`,
            limit: 1 // We only need one
        });

        if (files && files.length > 0) {
            const fileId = files[0].fileId;
            await imagekit.deleteFile(fileId);
            console.log(`Deleted old file from ImageKit: ${fileName} (${fileId})`);
            return true;
        }

        console.warn(`File not found in ImageKit for deletion: ${fileName}`);
        return false;

    } catch (error: any) {
        console.error('ImageKit delete by URL error:', error);
        // Don't throw, just return false so we don't block the main flow
        return false;
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
