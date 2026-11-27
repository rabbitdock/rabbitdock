import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { LIST_MODULES_CHANNEL, type ModuleInfo } from '../shared/modules'
import { APP_URL, handleAppScheme, moduleEntryUrl, registerAppScheme } from './app-protocol'
import { readInstalledModules } from './installed-modules'
import { handleFromApp } from './ipc'
import { lockDown } from './lockdown'

// In dev, electron-vite serves the renderer with HMR and passes its URL in this variable. An empty
// value counts as unset.
const devServerUrl = (app.isPackaged ? undefined : process.env['ELECTRON_RENDERER_URL']) || undefined
const devServerOrigin = devServerUrl ? new URL(devServerUrl).origin : undefined
const rendererUrl = devServerUrl ?? APP_URL

registerAppScheme(devServerOrigin)

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
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
        },
    })

    // Electron already logs a load that fails, so the returned promise is left alone.
    void window.loadURL(rendererUrl)
}

void app.whenReady().then(async () => {
    // Installing a module will put it in this folder. Until the app can install modules, the list
    // is read once at startup.
    const modules = await readInstalledModules(join(app.getPath('userData'), 'modules'))
    handleAppScheme(join(__dirname, '../renderer'), (id) => modules.get(id)?.dir, devServerOrigin)
    lockDown(isAppUrl)
    handleFromApp(LIST_MODULES_CHANNEL, isAppUrl, (): ModuleInfo[] =>
        [...modules.values()]
            .map(({ manifest: { id, name, version } }) => ({ id, name, version, entry: moduleEntryUrl(id) }))
            .sort((a, b) => a.name.localeCompare(b.name)),
    )
    createWindow()
})
