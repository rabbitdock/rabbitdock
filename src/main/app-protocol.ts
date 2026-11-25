import { net, protocol } from 'electron'
import { isAbsolute, join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

// The built renderer is served from rabbitdock://app/ instead of file://. A page on file:// can
// read any file on the machine, while this protocol only serves the files in out/renderer.
const APP_SCHEME = 'rabbitdock'
const APP_HOST = 'app'
export const APP_URL = `${APP_SCHEME}://${APP_HOST}/index.html`

// Everything is denied except the app's own scripts. Loosen a directive only when a feature
// needs it. It only applies to the built app, because the Vite dev server serves the page in dev,
// so a resource it blocks shows up in `npm run preview` and fails the smoke test.
const CONTENT_SECURITY_POLICY = "default-src 'none'; script-src 'self'; base-uri 'none'; form-action 'none'"

// Must run before the app is ready.
export function registerAppScheme(): void {
    protocol.registerSchemesAsPrivileged([{ scheme: APP_SCHEME, privileges: { standard: true, secure: true } }])
}

export function handleAppScheme(rendererDir: string): void {
    // What the protocol cannot serve fails like a network error, so Electron logs a page that does
    // not load instead of showing an empty document.
    protocol.handle(APP_SCHEME, async (request) => {
        const filePath = resolveInside(rendererDir, request.url)
        if (!filePath) return Response.error()
        try {
            const file = await net.fetch(pathToFileURL(filePath).toString())
            const headers = new Headers(file.headers)
            headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY)
            return new Response(file.body, { status: file.status, headers })
        } catch {
            return Response.error()
        }
    })
}

// Returns the file a rabbitdock://app/ URL points to, or undefined when it would leave rendererDir.
function resolveInside(rendererDir: string, url: string): string | undefined {
    try {
        const { host, pathname } = new URL(url)
        if (host !== APP_HOST) return undefined
        const filePath = join(rendererDir, decodeURIComponent(pathname))
        const inside = relative(rendererDir, filePath)
        if (inside === '' || inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) return undefined
        return filePath
    } catch {
        return undefined
    }
}
