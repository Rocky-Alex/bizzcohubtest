import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const REPO_LATEST_RELEASE_URL = "https://api.github.com/repos/Rocky-Alex/BC-Elite-QC/releases/latest";

// Fallback values if GitHub API fails
const FALLBACK_RELEASE_TAG = "v1.0.2";
const FALLBACK_ASSET_NAME = "BC_Elite_QC_Setup_Version_1.0.2.exe";
const FALLBACK_DOWNLOAD_URL = `https://github.com/Rocky-Alex/BC-Elite-QC/releases/download/${FALLBACK_RELEASE_TAG}/${FALLBACK_ASSET_NAME}`;

interface GitHubRelease {
    tag_name: string;
    assets: Array<{
        name: string;
        browser_download_url: string;
    }>;
}

/**
 * Helper to fetch the latest release data from GitHub API with revalidation caching.
 */
async function fetchLatestRelease(): Promise<{ tag: string; assetName: string; downloadUrl: string }> {
    try {
        const res = await fetch(REPO_LATEST_RELEASE_URL, {
            headers: {
                "User-Agent": "BizzCoHub-QC-Portal/1.0",
            },
            next: { revalidate: 3600 }, // Cache the GitHub API response for 1 hour
        });

        if (!res.ok) {
            throw new Error(`GitHub API returned status ${res.status}`);
        }

        const data: GitHubRelease = await res.json();
        
        // Find the setup .exe asset
        const exeAsset = data.assets.find(asset => asset.name.endsWith(".exe"));
        
        if (!exeAsset) {
            throw new Error("No setup .exe asset found in the latest release");
        }

        return {
            tag: data.tag_name,
            assetName: exeAsset.name,
            downloadUrl: exeAsset.browser_download_url
        };
    } catch (err) {
        console.error("Failed to fetch latest release from GitHub, using fallback:", err);
        return {
            tag: FALLBACK_RELEASE_TAG,
            assetName: FALLBACK_ASSET_NAME,
            downloadUrl: FALLBACK_DOWNLOAD_URL
        };
    }
}

/**
 * GET /api/qc/download
 *
 * Acts as a dynamic server-side proxy to the GitHub releases asset.
 * If ?info=true is passed, returns the tag name and asset details as JSON.
 * Otherwise, fetches the latest setup installer and streams the binary.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const infoOnly = searchParams.get("info") === "true";

        // Fetch latest release details from GitHub API (or cache)
        const { tag, assetName, downloadUrl } = await fetchLatestRelease();

        // 1. If requesting info only, return the metadata JSON
        if (infoOnly) {
            return NextResponse.json({
                success: true,
                version: tag,
                assetName: assetName,
                downloadUrl: downloadUrl
            });
        }

        // 2. Otherwise, fetch the binary and stream it
        const rangeHeader = request.headers.get("range");

        const upstream = await fetch(downloadUrl, {
            headers: {
                ...(rangeHeader ? { Range: rangeHeader } : {}),
                "User-Agent": "BizzCoHub-QC-Portal/1.0",
                "Accept-Encoding": "identity",
                Accept: "application/octet-stream",
            },
            redirect: "follow",
        });

        if (!upstream.ok && upstream.status !== 206) {
            return NextResponse.json(
                { error: `GitHub returned status ${upstream.status}` },
                { status: upstream.status }
            );
        }

        const headers = new Headers();
        headers.set("Content-Disposition", `attachment; filename="${assetName}"`);
        headers.set("Content-Type", "application/octet-stream");

        const contentLength = upstream.headers.get("content-length");
        if (contentLength) {
            headers.set("Content-Length", contentLength);
        }

        const contentRange = upstream.headers.get("content-range");
        if (contentRange) {
            headers.set("Content-Range", contentRange);
        }

        headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Disposition");
        headers.set("Cache-Control", "no-store");

        return new NextResponse(upstream.body, {
            status: upstream.status,
            headers,
        });
    } catch (err: any) {
        console.error("[/api/qc/download] Proxy error:", err);
        return NextResponse.json(
            { error: err?.message ?? "Unknown proxy error" },
            { status: 502 }
        );
    }
}
