import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /qcd
 * 
 * Shortcut route to trigger the direct download of the BC Elite QC software installer.
 * Redirects the client to the dedicated `/api/qc/download` route which streams the installer binary.
 */
export async function GET(request: NextRequest) {
    try {
        const downloadUrl = new URL("/api/qc/download", request.url);
        return NextResponse.redirect(downloadUrl);
    } catch (err: any) {
        console.error("Failed to redirect to QC download:", err);
        return NextResponse.json(
            { error: "Failed to process download request" },
            { status: 500 }
        );
    }
}
