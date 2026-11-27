import { ipcMain, type WebFrameMain } from 'electron'

// Answers an invoke on channel only when it comes from the app's own page in the top frame. Any
// other sender, including a frame that has already gone away, gets an error instead.
export function handleFromApp(channel: string, isAppUrl: (url: string) => boolean, handler: () => unknown): void {
    ipcMain.handle(channel, (event) => {
        if (!isFromApp(event.senderFrame, isAppUrl)) throw new Error(`Refused ${channel} from an unknown sender`)
        return handler()
    })
}

// Electron's security guide checks the origin instead of the URL, because `about:blank`, `blob:`
// and sandboxed documents have URLs that do not say who controls them.
function isFromApp(frame: WebFrameMain | null, isAppUrl: (url: string) => boolean): boolean {
    return frame !== null && frame.parent === null && isAppUrl(frame.origin)
}
