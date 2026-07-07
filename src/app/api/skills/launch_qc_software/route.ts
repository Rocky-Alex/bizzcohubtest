import { NextResponse } from "next/server";
import { exec, spawn } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

export const dynamic = "force-dynamic";

export async function GET() {
    const targetDir = "C:\\QC Software";
    const targetPath = "C:\\QC Software\\QC Software.exe";
    const sourcePath = path.join(process.cwd(), "public", "QC_Software", "QC_Software.exe");

    // Check if running on a non-Windows server (like Netlify serverless cloud)
    if (process.platform !== "win32") {
        return NextResponse.json({
            success: false,
            useProtocol: true,
            error: "Cloud Mode: The server is running in the cloud. We will attempt to launch the software using the custom bizzco-qa:// browser protocol."
        });
    }

    try {
        // Step A: Check if the file exists at C:\QC Software\QC Software.exe
        if (!fs.existsSync(targetPath)) {
            // Check if we have the source file to install from
            if (fs.existsSync(sourcePath)) {
                console.log("QC Software not found at target. Installing automatically from local source...");
                
                // Create target directory if it doesn't exist
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
                
                // Copy the file
                fs.copyFileSync(sourcePath, targetPath);
                console.log("QC Software installed successfully to C:\\QC Software\\QC Software.exe");
            } else {
                return NextResponse.json({
                    success: false,
                    error: "QC Software not found locally, and server installer is missing. Please download it manually."
                });
            }
        }

        // Step B: Execute the file using native OS command
        // "start" is the Windows native command to launch applications asynchronously
        try {
            const child = spawn("cmd.exe", ["/c", "start", '""', targetPath], {
                detached: true,
                stdio: "ignore"
            });
            child.unref();
            return NextResponse.json({
                success: true,
                message: "QC Software launched successfully"
            });
        } catch (error: any) {
            console.error("Failed to execute application:", error);
            return NextResponse.json({
                success: false,
                error: `Failed to launch QC Software: ${error.message}`
            }, { status: 500 });
        }
    } catch (e: any) {
        console.error("Install or Launch failed:", e);
        return NextResponse.json({
            success: false,
            error: `Server installation/launch failed: ${e.message}`
        }, { status: 500 });
    }
}
