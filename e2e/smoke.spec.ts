import { _electron as electron, expect, test } from '@playwright/test'
import { cp, mkdir, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const APP_URL = 'rabbitdock://app/index.html'

// A throwaway profile under test-results, so the test never touches the real one.
function userDataDir() {
    return test.info().outputPath('user-data')
}

// Puts modules where the app looks for installed ones. The example module from e2e/fixtures is
// built by `npm run test:smoke`, and the other three are broken on purpose.
async function installTestModules() {
    const modulesDir = join(userDataDir(), 'modules')
    await cp(join('out', 'modules', 'hello'), join(modulesDir, 'hello'), { recursive: true })
    const fake = async (folder: string, manifest: object, code: string) => {
        await mkdir(join(modulesDir, folder), { recursive: true })
        await writeFile(join(modulesDir, folder, 'manifest.json'), JSON.stringify(manifest))
        await writeFile(join(modulesDir, folder, 'index.js'), code)
    }
    await fake('broken', { id: 'broken', name: 'Broken', version: '0.1.0', contract: 1 }, 'throw new Error("broken on purpose")')
    await fake('future', { id: 'future', name: 'Future', version: '0.1.0', contract: 2 }, 'export default () => null')
    await fake('misnamed', { id: 'other', name: 'Misnamed', version: '0.1.0', contract: 1 }, 'export default () => null')

    // A link inside a module's folder that points outside of it.
    const outside = test.info().outputPath('outside')
    await mkdir(outside, { recursive: true })
    await writeFile(join(outside, 'secret.txt'), 'not part of any module')
    await symlink(outside, join(modulesDir, 'hello', 'link'), 'junction')

    // A real file two levels above a module's folder, so a refusal to serve it comes from the
    // protocol's checks and not from the file being missing.
    await writeFile(join(userDataDir(), 'outside.txt'), 'not part of any module')
}

// Opens the built app from out/, so run `npm run build` first. With RABBITDOCK_EXECUTABLE set to a
// packaged app, such as dist/win-unpacked/RabbitDock.exe, it opens that app instead. Playwright
// drives Electron through --inspect, so turning off the EnableNodeCliInspectArguments fuse would
// break this mode.
const packagedApp = process.env['RABBITDOCK_EXECUTABLE']

function launchApp() {
    return electron.launch({
        ...(packagedApp ? { executablePath: packagedApp } : {}),
        args: [...(packagedApp ? [] : ['.']), `--user-data-dir=${userDataDir()}`],
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
        await expect(window.getByText('No modules installed yet.')).toBeVisible()

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
        // The shell renders once the main process sends the list of modules.
        await expect(window.getByRole('heading', { name: 'RabbitDock' })).toBeVisible()

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

test('installed modules show up in the sidebar and load their pages', async () => {
    await installTestModules()
    const app = await launchApp()
    try {
        const window = await app.firstWindow()
        const nav = window.getByRole('navigation', { name: 'Modules' })

        // The modules with the wrong contract and with an id that does not match the folder are left out.
        await expect(nav.getByRole('button')).toHaveText(['Broken', 'Hello'])
        await expect(window.getByText('Choose a module in the sidebar.')).toBeVisible()

        // The counter uses a hook, which only works when the module and the app share one React.
        await nav.getByRole('button', { name: 'Hello' }).click()
        await expect(window.getByRole('heading', { name: 'Hello from a module' })).toBeVisible()
        const counter = window.getByRole('button', { name: /^Clicked/ })
        await counter.click()
        await counter.click()
        await expect(counter).toHaveText('Clicked 2 times')
        const errors = (await window.consoleMessages()).filter((message) => message.type() === 'error')
        expect(errors.map((message) => message.text())).toEqual([])

        // A module that fails only replaces its own page, and the others keep working.
        await nav.getByRole('button', { name: 'Broken' }).click()
        await expect(window.getByRole('alert')).toHaveText('Broken failed to load.')
        await nav.getByRole('button', { name: 'Hello' }).click()
        await expect(window.getByRole('heading', { name: 'Hello from a module' })).toBeVisible()
    } finally {
        await app.close()
    }
})

test('the protocol serves nothing outside an installed module', async () => {
    await installTestModules()
    const app = await launchApp()
    try {
        await app.firstWindow()
        const urls = [
            'rabbitdock://app/modules/hello/index.js',
            // Not installed, because its contract is not supported.
            'rabbitdock://app/modules/future/index.js',
            // Encoded separators that would climb out of the module's folder to a file that exists.
            // Only Windows reads the backslash as a separator.
            'rabbitdock://app/modules/hello/..%2F..%2Foutside.txt',
            'rabbitdock://app/modules/hello/..%5C..%5Coutside.txt',
            // A link inside the module's folder that points outside of it.
            'rabbitdock://app/modules/hello/link/secret.txt',
        ]
        const results = await app.evaluate(
            ({ net }, urls) => Promise.all(urls.map((url) => net.fetch(url).then(() => 'served', () => 'refused'))),
            urls,
        )
        expect(results).toEqual(['served', 'refused', 'refused', 'refused', 'refused'])
    } finally {
        await app.close()
    }
})
