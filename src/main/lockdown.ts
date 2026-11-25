import { app, session } from 'electron'

// Blocks everything a page could reach beyond the app itself. Loosen one rule at a time, when a
// feature needs it.
export function lockDown(isAppUrl: (url: string) => boolean): void {
    app.on('web-contents-created', (_event, contents) => {
        // Unlike will-navigate, this also covers frames inside the page.
        contents.on('will-frame-navigate', (event) => {
            if (!isAppUrl(event.url)) event.preventDefault()
        })
        contents.setWindowOpenHandler(() => ({ action: 'deny' }))
    })

    // Without these handlers Electron grants every permission, such as camera, microphone and
    // location, to any page.
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
    session.defaultSession.setPermissionCheckHandler(() => false)
    session.defaultSession.on('will-download', (event) => event.preventDefault())
}
