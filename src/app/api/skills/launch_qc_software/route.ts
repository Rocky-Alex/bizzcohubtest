import { NextResponse } from "next/server";
import { exec, spawn, execSync, execFileSync } from "child_process";
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
    const userHome = process.env.USERPROFILE || process.env.HOMEPATH || "";
    const downloadsPath = path.join(userHome, "Downloads", "QC Software.exe");

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
            let installerSource = "";
            if (fs.existsSync(downloadsPath)) {
                installerSource = downloadsPath;
            } else if (fs.existsSync(sourcePath)) {
                installerSource = sourcePath;
            }

            if (installerSource) {
                console.log(`QC Software Suite not installed. Installing automatically from ${installerSource}...`);
                
                // Create target directory if it doesn't exist
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
                
                // Copy the installer
                fs.copyFileSync(installerSource, installerPath);
                console.log("QC Software installer copied successfully. Running silent installer...");

                try {
                    // Run installer silently and wait for it to complete
                    execFileSync(installerPath, ["/VERYSILENT", "/SUPPRESSMSGBBOXES", "/NORESTART", `/DIR=${targetDir}`]);
                    console.log("QC Software Suite installed silently successfully.");
                } catch (err: any) {
                    console.warn("Silent installer execution failed in server process context. Falling back to protocol handler:", err.message);
                    return NextResponse.json({
                        success: false,
                        useProtocol: true,
                        error: "Permission Elevation Required: Redirecting to protocol handler..."
                    });
                }
            } else {
                return NextResponse.json({
                    success: false,
                    error: "QC Software not found. Please download the software first."
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
