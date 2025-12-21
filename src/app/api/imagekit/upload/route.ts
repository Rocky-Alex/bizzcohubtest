import { NextRequest, NextResponse } from 'next/server';
import { uploadToImageKit, deleteFromImageKit, deleteFileByUrl } from '@/lib/imagekit';

export const dynamic = 'force-dynamic';

// POST /api/imagekit/upload - Upload image to ImageKit
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';

        // process.env check removed to support fallback credentials in lib/imagekit.ts

        // Handle FormData uploads (for user avatars, file uploads)
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File;
            const folder = formData.get('folder') as string || 'uploads';
            const fileName = formData.get('fileName') as string || file?.name;

            if (!file) {
                return NextResponse.json(
                    { error: 'No file provided' },
                    { status: 400 }
                );
            }

            // Convert file to base64
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const base64 = buffer.toString('base64');
            const base64String = `data:${file.type};base64,${base64}`;

            console.log(`Uploading to ImageKit: ${fileName} to folder: ${folder}`);

            // Upload using the existing helper function
            const result = await uploadToImageKit(base64String, fileName, folder);

            console.log('ImageKit upload successful:', result.url);

            return NextResponse.json(result, { status: 200 });
        }

        // Handle JSON uploads (for products with base64 strings)
        const { file, fileName, folder, productType, brand, productName } = await request.json();

        if (!file || !fileName) {
            return NextResponse.json(
                { error: 'File and fileName are required' },
                { status: 400 }
            );
        }

        let targetFolder = folder || 'products';

        // dynamic folder logic
        if (productType && brand && productName) {
            const typeLower = productType.toLowerCase();
            let categoryFolder = 'Other';

            if (typeLower.includes('laptop')) {
                categoryFolder = 'Laptop';
            } else if (typeLower.includes('accessor')) {
                categoryFolder = 'Accessories';
            }

            // Sanitize names for folder usage if necessary, but keeping user's format preference
            // Structure: Product/Category/Brand/Name
            targetFolder = `Product/${categoryFolder}/${brand.trim()}/${productName.trim()}`;
        }

        const result = await uploadToImageKit(file, fileName, targetFolder);

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error('ImageKit upload error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        return NextResponse.json(
            {
                error: 'Failed to upload image',
                details: error.message,
                hint: 'Check ImageKit credentials in .env file'
            },
            { status: 500 }
        );
    }
}

// DELETE /api/imagekit/upload - Delete image from ImageKit
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const fileId = searchParams.get('fileId');
        const url = searchParams.get('url');

        if (fileId) {
            await deleteFromImageKit(fileId);
            return NextResponse.json({ message: 'Image deleted successfully' }, { status: 200 });
        }

        if (url) {
            const deleted = await deleteFileByUrl(url);
            if (deleted) {
                return NextResponse.json({ message: 'Image deleted by URL successfully' }, { status: 200 });
            } else {
                return NextResponse.json({ message: 'Image not found or could not be deleted' }, { status: 404 });
            }
        }

        return NextResponse.json(
            { error: 'fileId or url is required' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('ImageKit delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete image', details: error.message },
            { status: 500 }
        );
    }
}
