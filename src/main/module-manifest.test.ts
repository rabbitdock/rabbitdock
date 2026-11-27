import { describe, expect, it } from 'vitest'
import { MODULE_CONTRACT, parseManifest } from './module-manifest.mts'

const valid = { id: 'hello', name: 'Hello', version: '0.1.0', contract: MODULE_CONTRACT }

describe('parseManifest', () => {
    it('returns a valid manifest', () => {
        expect(parseManifest(valid)).toEqual(valid)
    })

    it('drops keys that the contract does not define', () => {
        expect(parseManifest({ ...valid, entry: '../../elsewhere.js' })).toEqual(valid)
    })

    it.each([null, undefined, 'hello', 42])('refuses %j, which is not an object', (value) => {
        expect(() => parseManifest(value)).toThrow('not an object')
    })

    it.each(['a', 'hello', 'hello-world', 'h2', 'console', 'com10', 'nul-module'])('accepts the id %j', (id) => {
        expect(parseManifest({ ...valid, id }).id).toBe(id)
    })

    // The id becomes a folder name and part of a URL.
    it.each(['', 'Hello', '1hello', '-hello', 'hello_world', 'hello/../other', 'hello\\other', 'hel lo', 'héllo', 'hello\n', 42])(
        'refuses the id %j',
        (id) => {
            expect(() => parseManifest({ ...valid, id })).toThrow('id')
        },
    )

    it.each(['con', 'prn', 'aux', 'nul', 'com1', 'lpt9'])('refuses the id %j, which Windows reserves', (id) => {
        expect(() => parseManifest({ ...valid, id })).toThrow('Windows reserves')
    })

    it.each(['', '   ', undefined, 42])('refuses the name %j', (name) => {
        expect(() => parseManifest({ ...valid, name })).toThrow('name')
    })

    it.each(['1', '1.2', '1.2.3-beta', 'v1.2.3', '1.2.3\n', 123])('refuses the version %j', (version) => {
        expect(() => parseManifest({ ...valid, version })).toThrow('version')
    })

    it.each([0, MODULE_CONTRACT + 1, String(MODULE_CONTRACT), undefined])('refuses the contract %j', (contract) => {
        expect(() => parseManifest({ ...valid, contract })).toThrow('contract')
    })
})
