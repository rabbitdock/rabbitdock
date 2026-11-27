// Builds one module into out/modules/<id>/, apart from the app. Usage:
//     node scripts/build-module.mts <module folder>
//
// A module uses the app's React instead of bundling its own, because hooks break when a page runs
// two copies of React. Its imports of react, react/jsx-runtime and react-dom resolve to generated
// modules that read the app's copy from globalThis.__rabbitdockHost, which src/renderer/src/host.ts
// sets before the app loads any module.
//
// A module cannot bring CSS or other assets yet. The app loads only index.js, and library mode
// inlines imported images and fonts as `data:` URLs, which the Content-Security-Policy blocks.
import { copyFile, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { build, type Plugin } from 'vite'
import { parseManifest } from '../src/main/module-manifest.mts'

const HOST_GLOBAL = '__rabbitdockHost'

// Each shared package and the property of the host object that holds the app's copy of it.
const SHARED_PACKAGES: Record<string, string> = {
    react: 'react',
    'react/jsx-runtime': 'jsxRuntime',
    'react-dom': 'reactDom',
}

const require = createRequire(import.meta.url)

// The generated module re-exports every export of the installed package, so the list follows
// the React version in package.json. Each export goes through a call marked as pure, so the
// bundler drops the ones the module does not use, which it cannot do for a plain property read.
function sharedPackages(): Plugin {
    // Plain text instead of the usual \0, which ended up in a comment of the built file.
    const prefix = 'rabbitdock-shared:'
    return {
        name: 'rabbitdock-shared-packages',
        enforce: 'pre',
        resolveId(source) {
            return Object.hasOwn(SHARED_PACKAGES, source) ? prefix + source : null
        },
        load(id) {
            if (!id.startsWith(prefix)) return null
            const name = id.slice(prefix.length)
            const exports = Object.keys(require(name) as object)
            return [
                `const shared = globalThis.${HOST_GLOBAL}.${SHARED_PACKAGES[name]}`,
                'const pick = (key) => shared[key]',
                'export default shared',
                ...exports.map((key) => `export const ${key} = /* @__PURE__ */ pick('${key}')`),
            ].join('\n')
        },
    }
}

const [folder] = process.argv.slice(2)
if (!folder) throw new Error('Usage: node scripts/build-module.mts <module folder>')
const moduleDir = resolve(folder)
// The same check the app runs, so a module that builds also loads.
const manifest = parseManifest(JSON.parse(await readFile(join(moduleDir, 'manifest.json'), 'utf8')))
const outDir = resolve('out', 'modules', manifest.id)

await build({
    configFile: false,
    root: moduleDir,
    logLevel: 'warn',
    plugins: [sharedPackages(), react()],
    // Library mode leaves process.env in the code, and the page has no process to read it from.
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: {
        outDir,
        emptyOutDir: true,
        lib: { entry: join(moduleDir, 'src', 'index.tsx'), formats: ['es'], fileName: () => 'index.js' },
    },
})
await copyFile(join(moduleDir, 'manifest.json'), join(outDir, 'manifest.json'))
console.log(`Built module ${manifest.id} into ${outDir}`)
