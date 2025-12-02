import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";

export async function GET() {
    try {
        const uploadDir = path.join(process.cwd(), "public/uploads");

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const files = fs.readdirSync(uploadDir);
        const images = files.filter(file =>
            /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)
        );

        return NextResponse.json({ images });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to list images" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file received" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = file.name.replace(/\s+/g, "-");
        const uploadDir = path.join(process.cwd(), "public/uploads");

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        await writeFile(path.join(uploadDir, filename), buffer);

        return NextResponse.json({
            message: "Upload successful",
            filename
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Upload failed" },
            { status: 500 }
        );
    }
}
