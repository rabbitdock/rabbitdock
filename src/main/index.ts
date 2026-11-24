import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'

function createWindow(): void {
    const window = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'RabbitDock',
    })

    // In dev, electron-vite serves the renderer with HMR and passes its URL in this variable.
    // Electron already logs a load that fails, so the returned promise is left alone.
    const devServerUrl = process.env['ELECTRON_RENDERER_URL']
    if (!app.isPackaged && devServerUrl) {
        void window.loadURL(devServerUrl)
    } else {
        void window.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

void app.whenReady().then(createWindow)
