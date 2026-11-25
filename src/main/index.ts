import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { APP_URL, handleAppScheme, registerAppScheme } from './app-protocol'
import { lockDown } from './lockdown'

// In dev, electron-vite serves the renderer with HMR and passes its URL in this variable.
const devServerUrl = app.isPackaged ? undefined : process.env['ELECTRON_RENDERER_URL']
const rendererUrl = devServerUrl || APP_URL

registerAppScheme()

// True for a URL on the renderer's own scheme and host, so reloads keep working.
function isAppUrl(url: string): boolean {
    try {
        const target = new URL(url)
        const own = new URL(rendererUrl)
        return target.protocol === own.protocol && target.host === own.host
    } catch {
        return false
    }
}

function createWindow(): void {
    const window = new BrowserWindow({
        width: 1200,
        height: 800,
    })

    // Electron already logs a load that fails, so the returned promise is left alone.
    void window.loadURL(rendererUrl)
}

void app.whenReady().then(() => {
    handleAppScheme(join(__dirname, '../renderer'))
    lockDown(isAppUrl)
    createWindow()
})
