import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseManifest, type ModuleManifest } from './module-manifest.mts'

export interface InstalledModule {
    manifest: ModuleManifest
    dir: string
}

// Reads the modules installed in modulesDir, where each module has a folder named after its id.
// A folder whose manifest is missing or invalid is skipped with a warning, so one broken module
// does not keep the others from loading. Anything that is not a plain folder, such as a link in
// place of a module's folder, is ignored.
export async function readInstalledModules(modulesDir: string): Promise<Map<string, InstalledModule>> {
    const modules = new Map<string, InstalledModule>()
    let entries
    try {
        entries = await readdir(modulesDir, { withFileTypes: true })
    } catch (error) {
        // Before the first install the folder does not exist.
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') console.warn(`Could not read ${modulesDir}:`, error)
        return modules
    }
    for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const dir = join(modulesDir, entry.name)
        try {
            const manifest = parseManifest(JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')))
            if (manifest.id !== entry.name) throw new Error(`the id is ${manifest.id} but the folder is ${entry.name}`)
            modules.set(manifest.id, { manifest, dir })
        } catch (error) {
            console.warn(`Skipping the module in ${dir}: ${(error as Error).message}`)
        }
    }
    return modules
}
