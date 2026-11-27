import { net, protocol } from 'electron'
import { realpath } from 'node:fs/promises'
import { isAbsolute, join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

// The built renderer is served from rabbitdock://app/ instead of file://. A page on file:// can
// read any file on the machine, while this protocol only serves the files in out/renderer and
// those of the installed modules.
const APP_SCHEME = 'rabbitdock'
const APP_HOST = 'app'
export const APP_URL = `${APP_SCHEME}://${APP_HOST}/index.html`

// Everything is denied except the app's own scripts, stylesheets and fonts. Loosen a directive only
// when a feature needs it. It only applies to the built app, because the Vite dev server serves the
// page in dev, so a resource it blocks shows up in `npm run preview` and fails the smoke test.
const CONTENT_SECURITY_POLICY =
    "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'"

// A module's code is served under the app's own origin, so the Content-Security-Policy treats it
// as the app's and needs no exception for it.
export function moduleEntryUrl(id: string): string {
    return `${APP_SCHEME}://${APP_HOST}/modules/${id}/index.js`
}

// Must run before the app is ready. In dev the page comes from the Vite dev server, so loading a
// module from rabbitdock://app is a cross-origin request. Only then is the scheme CORS-enabled and
// do its responses allow the dev server's origin. The built app loads modules from its own origin
// and needs neither.
export function registerAppScheme(devServerOrigin: string | undefined): void {
    const privileges = { standard: true, secure: true, corsEnabled: devServerOrigin !== undefined }
    protocol.registerSchemesAsPrivileged([{ scheme: APP_SCHEME, privileges }])
}

// moduleDir returns the folder of an installed module, or undefined for an id that is not installed.
export function handleAppScheme(
    rendererDir: string,
    moduleDir: (id: string) => string | undefined,
    devServerOrigin: string | undefined,
): void {
    // What the protocol cannot serve fails like a network error, so Electron logs a page that does
    // not load instead of showing an empty document.
    protocol.handle(APP_SCHEME, async (request) => {
        const target = resolveFile(request.url, rendererDir, moduleDir)
        if (!target) return Response.error()
        try {
            if (target.moduleDir && !(await staysInside(target.moduleDir, target.filePath))) return Response.error()
            const file = await net.fetch(pathToFileURL(target.filePath).toString())
            const headers = new Headers(file.headers)
            headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY)
            if (devServerOrigin) headers.set('Access-Control-Allow-Origin', devServerOrigin)
            return new Response(file.body, { status: file.status, headers })
        } catch {
            return Response.error()
        }
    })
}

interface Target {
    filePath: string
    // Set when the file belongs to a module, whose folder still needs the check for links.
    moduleDir?: string
}

// Returns the file a rabbitdock://app/ URL points to. A path under /modules/<id>/ is read from that
// module's folder, and any other path from rendererDir. Returns undefined for a module that is not
// installed and for a path that would leave its folder.
function resolveFile(url: string, rendererDir: string, moduleDir: (id: string) => string | undefined): Target | undefined {
    try {
        const { host, pathname } = new URL(url)
        if (host !== APP_HOST) return undefined
        const path = decodeURIComponent(pathname)
        const module = /^\/modules\/([^/]+)(\/.*)$/.exec(path)
        if (!module) {
            const filePath = join(rendererDir, path)
            return isInside(rendererDir, filePath) ? { filePath } : undefined
        }
        const dir = moduleDir(module[1]!)
        if (!dir) return undefined
        const filePath = join(dir, module[2]!)
        return isInside(dir, filePath) ? { filePath, moduleDir: dir } : undefined
    } catch {
        return undefined
    }
}

// A module's folder comes from a downloaded package, and a link inside it could point anywhere on
// the disk, which a check on the path text cannot see. So the real paths have to nest as well.
// realpath throws for a file that does not exist, which the caller turns into an error response.
// The renderer's files come with the app, inside the read-only app.asar once it is packaged.
async function staysInside(dir: string, filePath: string): Promise<boolean> {
    return isInside(await realpath(dir), await realpath(filePath))
}

function isInside(dir: string, filePath: string): boolean {
    const inside = relative(dir, filePath)
    return inside !== '' && inside !== '..' && !inside.startsWith(`..${sep}`) && !isAbsolute(inside)
}
