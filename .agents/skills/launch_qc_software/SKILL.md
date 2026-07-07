---
name: launch_qc_software
description: Checks if C:\QC Software\QC Software.exe exists and launches it. If not found, returns an error.
---

# launch_qc_software

This skill launches the QC Software workstation client located locally at `C:\QC Software\QC Software.exe`.

## Usage
The skill is triggered by the web frontend via the Next.js API bridge. It checks for the file's presence and executes it.
