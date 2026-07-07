import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

export async function GET() {
    const targetDir = "C:\\QC Software";
    const targetPath = "C:\\QC Software\\QC Software.exe";
    const sourcePath = path.join(process.cwd(), "public", "QC_Software", "QC_Software.exe");

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
        return new Promise((resolve) => {
            exec(`start "" "${targetPath}"`, (error) => {
                if (error) {
                    console.error("Failed to execute application:", error);
                    resolve(NextResponse.json({
                        success: false,
                        error: `Failed to launch QC Software: ${error.message}`
                    }, { status: 500 }));
                    return;
                }
                resolve(NextResponse.json({
                    success: true,
                    message: "QC Software launched successfully"
                }));
            });
        });
    } catch (e: any) {
        console.error("Install or Launch failed:", e);
        return NextResponse.json({
            success: false,
            error: `Server installation/launch failed: ${e.message}`
        }, { status: 500 });
    }
}
