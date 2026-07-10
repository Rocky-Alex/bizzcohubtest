import { NextResponse } from "next/server";
import { exec, spawn, execSync, execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "run";

    const userHome = process.env.USERPROFILE || process.env.HOMEPATH || "";
    const downloadsInstaller = path.join(userHome, "Downloads", "QC Software.exe");
    const targetDir = "C:\\QC Software";
    const targetInstaller = path.join(targetDir, "QC Software.exe");
    const sourcePath = path.join(process.cwd(), "public", "QC_Software", "QC_Software.exe");

    // Check if running on a non-Windows server (like Netlify serverless cloud)
    if (process.platform !== "win32") {
        return NextResponse.json({
            success: false,
            useProtocol: true,
            error: "Cloud Mode: The server is running in the cloud. We will attempt to run the software using the custom bizzco-qa:// browser protocol."
        });
    }

    try {
        if (action === "check") {
            const exists = fs.existsSync(downloadsInstaller);
            return NextResponse.json({ success: true, exists });
        }

        if (action === "run") {
            if (fs.existsSync(downloadsInstaller)) {
                // Open/run the installer automatically in interactive mode
                const child = spawn("cmd.exe", ["/c", "start", '""', downloadsInstaller], {
                    detached: true,
                    stdio: "ignore"
                });
                child.unref();
                return NextResponse.json({ success: true, message: "Installer opened successfully" });
            } else {
                return NextResponse.json({ success: false, error: "Installer not found in Downloads" });
            }
        }

        if (action === "autodownload") {
            if (fs.existsSync(sourcePath)) {
                // Ensure Downloads directory exists
                const downloadsDir = path.join(userHome, "Downloads");
                if (!fs.existsSync(downloadsDir)) {
                    fs.mkdirSync(downloadsDir, { recursive: true });
                }

                // Copy installer to user Downloads directory
                fs.copyFileSync(sourcePath, downloadsInstaller);
                console.log("Installer copied to Downloads folder successfully.");

                // Create target C:\QC Software directory if it doesn't exist
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }

                // Copy installer to target directory
                fs.copyFileSync(downloadsInstaller, targetInstaller);

                try {
                    // Run silent installer
                    execFileSync(targetInstaller, ["/VERYSILENT", "/SUPPRESSMSGBBOXES", "/NORESTART", `/DIR=${targetDir}`]);
                    console.log("QC Software Suite auto-installed silently successfully.");
                    return NextResponse.json({ success: true, message: "Downloaded and installed silently successfully" });
                } catch (installErr: any) {
                    console.warn("Silent installer execution failed in server process context. Running interactively:", installErr.message);
                    
                    // Fallback: Run installer interactively for the user
                    const child = spawn("cmd.exe", ["/c", "start", '""', downloadsInstaller], {
                        detached: true,
                        stdio: "ignore"
                    });
                    child.unref();
                    return NextResponse.json({ success: true, message: "Downloaded and launched installer interactively" });
                }
            } else {
                return NextResponse.json({ success: false, error: "QC_Software.exe source file is missing from public server resources." });
            }
        }

        return NextResponse.json({ success: false, error: "Invalid action" });
    } catch (e: any) {
        console.error("Auto run action failed:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
