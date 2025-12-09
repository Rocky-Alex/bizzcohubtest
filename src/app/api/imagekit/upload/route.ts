import { NextRequest, NextResponse } from 'next/server';
import { uploadToImageKit, deleteFromImageKit } from '@/lib/imagekit';

export const dynamic = 'force-dynamic';

// POST /api/imagekit/upload - Upload image to ImageKit
export async function POST(request: NextRequest) {
    try {
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
        return NextResponse.json(
            { error: 'Failed to upload image', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/imagekit/upload - Delete image from ImageKit
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const fileId = searchParams.get('fileId');

        if (!fileId) {
            return NextResponse.json(
                { error: 'fileId is required' },
                { status: 400 }
            );
        }

        await deleteFromImageKit(fileId);

        return NextResponse.json({ message: 'Image deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('ImageKit delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete image', details: error.message },
            { status: 500 }
        );
    }
}
