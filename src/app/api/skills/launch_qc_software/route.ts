import { NextResponse } from "next/server";
import { exec, spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

export const dynamic = "force-dynamic";

export async function GET() {
    const targetDir = "C:\\QC Software";
    const installerPath = "C:\\QC Software\\QC Software.exe";
    const checkPath = "C:\\QC Software\\Master Checker\\BizzCoHub QC File.bat";
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
        // Step A: Check if the file is installed
        if (!fs.existsSync(checkPath)) {
            // Check if we have the source file to install from
            if (fs.existsSync(sourcePath)) {
                console.log("QC Software Suite not installed. Installing automatically from local source...");
                
                // Create target directory if it doesn't exist
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
                
                // Copy the installer
                fs.copyFileSync(sourcePath, installerPath);
                console.log("QC Software installer copied successfully. Running silent installer...");

                // Run installer silently and wait for it to complete
                execSync(`"${installerPath}" /VERYSILENT /SUPPRESSMSGBBOXES /NORESTART /DIR="${targetDir}"`);
                console.log("QC Software Suite installed silently successfully.");
            } else {
                return NextResponse.json({
                    success: false,
                    error: "QC Software not found locally, and server installer is missing. Please download it manually."
                });
            }
        }

        // Step B: Execute the Master Checker batch file using native OS command
        try {
            const child = spawn("cmd.exe", ["/c", "start", '""', checkPath], {
                detached: true,
                stdio: "ignore"
            });
            child.unref();
            return NextResponse.json({
                success: true,
                message: "QC Software Suite launched successfully"
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
