import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'RabbitDock',
  })

  // In dev, electron-vite serves the renderer with HMR and passes its URL in this variable.
  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  const loading =
    !app.isPackaged && devServerUrl
      ? window.loadURL(devServerUrl)
      : window.loadFile(join(__dirname, '../renderer/index.html'))

  // Without this, a missing build or a stopped dev server is just a blank window.
  loading.catch((error: unknown) => console.error('Failed to load the renderer:', error))
}

void app.whenReady().then(createWindow)
