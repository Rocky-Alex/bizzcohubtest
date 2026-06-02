/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    executePowerShell: (command: string) => Promise<{ error: any, stdout: string, stderr: string }>
  }
}
