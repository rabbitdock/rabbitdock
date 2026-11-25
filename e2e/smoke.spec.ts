import { _electron as electron, expect, test } from '@playwright/test'

// Opens the built app from out/, so run `npm run build` first.
test('the app opens its window and renders the page', async ({}, testInfo) => {
    const app = await electron.launch({
        // A throwaway profile under test-results, so the test never touches the real one.
        args: ['.', `--user-data-dir=${testInfo.outputPath('user-data')}`],
        // The app loads ELECTRON_RENDERER_URL when it is set, so clear it to test the built files.
        env: { ...process.env, ELECTRON_RENDERER_URL: '' } as Record<string, string>,
        // On Linux, Playwright starts Electron with --no-sandbox unless chromiumSandbox is set.
        // The app runs with the sandbox on, so the test does too.
        chromiumSandbox: true,
    })
    try {
        const window = await app.firstWindow()
        await expect(window).toHaveTitle('RabbitDock')
        await expect(window.getByRole('heading', { name: 'RabbitDock' })).toBeVisible()
    } finally {
        await app.close()
    }
})
