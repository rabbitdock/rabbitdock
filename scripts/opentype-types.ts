// opentype.js ships no type declarations. These cover only what scripts/build-brand.mts uses.
declare module 'opentype.js' {
    interface BoundingBox {
        x1: number
        x2: number
    }

    interface Path {
        getBoundingBox(): BoundingBox
        toPathData(options?: { decimalPlaces?: number; flipY?: boolean }): string
    }

    interface Glyph {
        advanceWidth: number
        getPath(x: number, y: number, fontSize: number): Path
    }

    interface Font {
        unitsPerEm: number
        tables: { os2: { sCapHeight: number } }
        charToGlyph(char: string): Glyph
    }

    const opentype: {
        parse(buffer: ArrayBuffer): Font
    }

    export default opentype
}
