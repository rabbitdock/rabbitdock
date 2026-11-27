import { _electron as electron, expect, test } from '@playwright/test'

const APP_URL = 'rabbitdock://app/index.html'

// Opens the built app from out/, so run `npm run build` first. With RABBITDOCK_EXECUTABLE set to a
// packaged app, such as dist/win-unpacked/RabbitDock.exe, it opens that app instead. Playwright
// drives Electron through --inspect, so turning off the EnableNodeCliInspectArguments fuse would
// break this mode.
const packagedApp = process.env['RABBITDOCK_EXECUTABLE']

function launchApp() {
    return electron.launch({
        ...(packagedApp ? { executablePath: packagedApp } : {}),
        // A throwaway profile under test-results, so the test never touches the real one.
        args: [...(packagedApp ? [] : ['.']), `--user-data-dir=${test.info().outputPath('user-data')}`],
        // The app loads ELECTRON_RENDERER_URL when it is set, so clear it to test the built files.
        env: { ...process.env, ELECTRON_RENDERER_URL: '' } as Record<string, string>,
        // On Linux, Playwright starts Electron with --no-sandbox unless chromiumSandbox is set.
        // The app runs with the sandbox on, so the test does too.
        chromiumSandbox: true,
    })
}

test('the app opens its window and renders the shell', async () => {
    const app = await launchApp()
    try {
        const window = await app.firstWindow()
        await expect(window).toHaveURL(APP_URL)
        await expect(window).toHaveTitle('RabbitDock')
        await expect(window.getByRole('heading', { name: 'RabbitDock' })).toBeVisible()

        // Without the stylesheet the sidebar would sit above the content instead of beside it.
        const sidebar = await window.getByRole('complementary').boundingBox()
        const content = await window.getByRole('main').boundingBox()
        expect(sidebar).not.toBeNull()
        expect(content).not.toBeNull()
        expect(sidebar!.x + sidebar!.width).toBeLessThanOrEqual(content!.x)

        // A resource the Content-Security-Policy blocks only shows up as a console error.
        const errors = (await window.consoleMessages()).filter((message) => message.type() === 'error')
        expect(errors.map((message) => message.text())).toEqual([])
        expect(await window.pageErrors()).toEqual([])
    } finally {
        await app.close()
    }
})

// The checks run inside the page, so they are passed as strings rather than typed as Node code.
test('the page cannot leave the app or reach the system', async () => {
    const app = await launchApp()
    try {
        const window = await app.firstWindow()
        await expect(window).toHaveURL(APP_URL)

        expect(await window.evaluate('typeof process')).toBe('undefined')
        expect(await window.evaluate('window.open("https://example.com/") === null')).toBe(true)
        expect(await window.evaluate('import("data:text/javascript,").then(() => "loaded", () => "blocked")')).toBe('blocked')
        expect(await window.evaluate('navigator.permissions.query({ name: "geolocation" }).then((s) => s.state)')).toBe('denied')
        expect(await window.evaluate('Notification.requestPermission()')).toBe('denied')

        // The protocol refuses a path that leaves out/renderer. The slash is encoded so the URL keeps
        // it on Windows and on Linux.
        const escaped = await app.evaluate(({ net }) =>
            net.fetch('rabbitdock://app/..%2F..%2Fpackage.json').then(() => 'served', () => 'refused'),
        )
        expect(escaped).toBe('refused')

        // Another host on the app's own scheme is refused too, and it answers without the network.
        // The navigation starts in the page, and the main process reads where it ended.
        const landed = await app.evaluate(({ BrowserWindow }) => {
            const contents = BrowserWindow.getAllWindows()[0]!.webContents
            const stopped = new Promise<string>((resolve) => contents.once('did-stop-loading', () => resolve(contents.getURL())))
            contents.executeJavaScript('location.href = "rabbitdock://other/index.html"').catch(() => {})
            return stopped
        })
        expect(landed).toBe(APP_URL)
        expect(await window.evaluate('document.querySelector("h1")?.textContent')).toBe('RabbitDock')
    } finally {
        await app.close()
    }
})
