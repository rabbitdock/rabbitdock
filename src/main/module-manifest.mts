// This file is .mts so that scripts/build-module.mts can import it with Node, which would otherwise
// treat a .ts file in this package as CommonJS and warn when it finds ES module syntax.

// The version of the module contract this app supports. Each module declares the one it was
// written for, and a module written for another version is not loaded.
export const MODULE_CONTRACT = 1

export interface ModuleManifest {
    id: string
    name: string
    version: string
    contract: number
}

// The id becomes a folder name and part of a URL, so it holds nothing that could change either.
const ID_PATTERN = /^[a-z][a-z0-9-]*$/
// Device names that Windows does not allow as a folder name. The pattern above already rules out
// the forms with an extension or a superscript digit.
const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/

// Checks the parsed manifest.json of a module and throws with the reason when it is not valid.
export function parseManifest(value: unknown): ModuleManifest {
    if (typeof value !== 'object' || value === null) throw new Error('the manifest is not an object')
    const { id, name, version, contract } = value as Record<string, unknown>
    if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
        throw new Error('the id must be lowercase letters, digits and hyphens, starting with a letter')
    }
    if (WINDOWS_RESERVED_NAME.test(id)) throw new Error(`the id ${id} is a device name that Windows reserves`)
    if (typeof name !== 'string' || name.trim() === '') throw new Error('the name must be a non-empty string')
    if (typeof version !== 'string' || !VERSION_PATTERN.test(version)) throw new Error('the version must look like 1.2.3')
    if (contract !== MODULE_CONTRACT) throw new Error(`the contract must be ${MODULE_CONTRACT}`)
    return { id, name, version, contract }
}
