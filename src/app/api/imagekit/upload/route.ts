import { NextRequest, NextResponse } from 'next/server';
import { uploadToImageKit, deleteFromImageKit } from '@/lib/imagekit';

// POST /api/imagekit/upload - Upload image to ImageKit
export async function POST(request: NextRequest) {
    try {
        const { file, fileName, folder } = await request.json();

        if (!file || !fileName) {
            return NextResponse.json(
                { error: 'File and fileName are required' },
                { status: 400 }
            );
        }

        const result = await uploadToImageKit(file, fileName, folder || 'products');

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
