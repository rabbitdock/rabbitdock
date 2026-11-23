// Generates the SVG and PNG files in brand/ from the drawings below. Run it with `npm run brand`.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import opentype from 'opentype.js'

interface Colors {
  rabbit: string
  dock: string
}

interface LogoColors extends Colors {
  wordmark: string
}

interface Drawing {
  box: number
  transform?: string
  rabbit: string[]
  dock: string[]
}

interface AppIconDrawing extends Drawing {
  tile: string
}

const brandDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'brand')
const fontPath = join(brandDir, 'fonts', 'InterDisplay-SemiBold.ttf')

const palette = {
  light: { rabbit: '#607F9E', dock: '#262B33', wordmark: '#262B33' },
  dark: { rabbit: '#86A0BC', dock: '#CDD2D9', wordmark: '#CDD2D9' },
  monoOnLight: '#262B33',
  monoOnDark: '#E8EBEF',
  appIconTile: '#262B33',
}

function mono(color: string): Colors {
  return { rabbit: color, dock: color }
}

function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`
}

// Each drawing has its own size range. The full drawing is used from 32 px up, the small one at
// 22 and 24 px and for the tray at 32 px, and the 16 px drawings sit on whole pixels so their
// edges stay sharp.
const FULL: Drawing = {
  box: 256,
  transform: 'translate(0 5)',
  rabbit: [
    'M 73.48 114.67 C 77.91 106.83 82.48 96.93 81.38 88 L 74.63 33.07 A 17 17 0 0 1 108.37 28.93 L 114.15 76 C 115.98 90.89 140.02 90.89 141.85 76 L 147.63 28.93 A 17 17 0 0 1 181.37 33.07 L 174.62 88 C 173.52 96.93 178.09 106.83 182.52 114.67 C 186.16 121.11 188 128.89 188 138 C 188 168.36 167.6 184 128 184 C 88.4 184 68 168.36 68 138 C 68 128.89 69.84 121.11 73.48 114.67 Z',
  ],
  dock: [
    'M 34 160 L 59.35 160 C 67.53 183.82 90.65 196 128 196 C 165.35 196 188.47 183.82 196.65 160 L 222 160 A 14 14 0 0 1 236 174 L 236 218 A 14 14 0 0 1 222 232 L 34 232 A 14 14 0 0 1 20 218 L 20 174 A 14 14 0 0 1 34 160 Z',
  ],
}

const SMALL: Drawing = {
  box: 256,
  transform: 'translate(0 3)',
  rabbit: [
    'M 69.05 114.11 C 72.29 105.71 73.95 100.93 72.85 92 L 66.3 38.68 A 22 22 0 0 1 109.98 33.32 L 114.73 72 C 116.68 87.88 139.32 87.88 141.27 72 L 146.02 33.32 A 22 22 0 0 1 189.7 38.68 L 183.15 92 C 182.05 100.93 183.71 105.71 186.95 114.11 C 188.98 119.35 190 125.32 190 132 C 190 162.36 168.92 178 128 178 C 87.08 178 66 162.36 66 132 C 66 125.32 67.02 119.35 69.05 114.11 Z',
  ],
  dock: [
    'M 30 160 L 53.15 160 C 63.33 183.83 88.51 196 128 196 C 167.49 196 192.67 183.83 202.85 160 L 226 160 A 14 14 0 0 1 240 174 L 240 222 A 14 14 0 0 1 226 236 L 30 236 A 14 14 0 0 1 16 222 L 16 174 A 14 14 0 0 1 30 160 Z',
  ],
}

// In a 16 x 16 grid. The ears step out by one pixel instead of leaning, which a 16 px icon cannot draw.
const PIXEL16: Drawing = {
  box: 16,
  rabbit: [
    'M 4 4 V 2 A 1 1 0 0 1 6 2 V 4 H 7 V 7 H 5 V 4 Z',
    'M 12 4 V 2 A 1 1 0 0 0 10 2 V 4 H 9 V 7 H 11 V 4 Z',
    'M 5 6 H 11 A 1 1 0 0 1 12 7 V 9 A 2 2 0 0 1 10 11 H 6 A 2 2 0 0 1 4 9 V 7 A 1 1 0 0 1 5 6 Z',
  ],
  dock: [
    'M 2 10 H 3 A 3 2 0 0 0 6 12 H 10 A 3 2 0 0 0 13 10 H 14 A 1 1 0 0 1 15 11 V 13 A 2 2 0 0 1 13 15 H 3 A 2 2 0 0 1 1 13 V 11 A 1 1 0 0 1 2 10 Z',
  ],
}

// The app icon carries its own graphite tile, so it reads on light and dark taskbars alike.
const APP_FULL: AppIconDrawing = {
  ...FULL,
  transform: 'translate(128 128) scale(0.72) translate(-128 -123)',
  tile: roundedRect(8, 8, 240, 240, 52),
}
const APP_SMALL: AppIconDrawing = {
  ...SMALL,
  transform: 'translate(128 128) scale(0.74) translate(-128 -125)',
  tile: roundedRect(0, 0, 256, 256, 56),
}
const APP_PIXEL16: AppIconDrawing = {
  box: 16,
  tile: roundedRect(0, 0, 16, 16, 3),
  rabbit: [
    'M 4 5 V 3 A 1 1 0 0 1 6 3 V 5 H 7 V 7 H 5 V 5 Z',
    'M 12 5 V 3 A 1 1 0 0 0 10 3 V 5 H 9 V 7 H 11 V 5 Z',
    'M 6 6 H 10 A 1 1 0 0 1 11 7 V 8.5 A 1.5 1.5 0 0 1 9.5 10 H 6.5 A 1.5 1.5 0 0 1 5 8.5 V 7 A 1 1 0 0 1 6 6 Z',
  ],
  dock: [
    'M 3 10 H 4 A 2 1 0 0 0 6 11 H 10 A 2 1 0 0 0 12 10 H 13 A 1 1 0 0 1 14 11 V 13 A 1 1 0 0 1 13 14 H 3 A 1 1 0 0 1 2 13 V 11 A 1 1 0 0 1 3 10 Z',
  ],
}

function symbolGroup(drawing: Drawing, colors: Colors): string {
  const attr = drawing.transform ? ` transform="${drawing.transform}"` : ''
  return [
    `  <g${attr}>`,
    ...drawing.rabbit.map((d) => `    <path fill="${colors.rabbit}" d="${d}"/>`),
    ...drawing.dock.map((d) => `    <path fill="${colors.dock}" d="${d}"/>`),
    '  </g>',
  ].join('\n')
}

function svgDocument(width: number, height: number, body: string): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '  <title>RabbitDock</title>',
    body,
    '</svg>',
    '',
  ].join('\n')
}

function symbolSvg(drawing: Drawing, colors: Colors): string {
  return svgDocument(drawing.box, drawing.box, symbolGroup(drawing, colors))
}

function appIconSvg(drawing: AppIconDrawing): string {
  const tile = `  <path fill="${palette.appIconTile}" d="${drawing.tile}"/>`
  return svgDocument(drawing.box, drawing.box, [tile, symbolGroup(drawing, palette.dark)].join('\n'))
}

// The wordmark is set as outlines so the logo files do not need the font installed.
const font = opentype.parse(new Uint8Array(await readFile(fontPath)).buffer)
const FONT_SIZE = 150
const TRACKING = -0.025 * FONT_SIZE
const scale = FONT_SIZE / font.unitsPerEm
// stringToGlyphs runs Inter's substitution lookups, one of which opentype.js cannot parse.
// The wordmark needs no substitutions, so each character maps straight to its glyph.
const glyphs = [...'RabbitDock'].map((char) => font.charToGlyph(char))

function layoutWordmark(originX: number, baseline: number): { d: string; left: number; right: number } {
  let x = originX
  const paths = glyphs.map((glyph, i) => {
    const path = glyph.getPath(x, baseline, FONT_SIZE)
    // Letters are spaced by their advance width and the tracking. Kerning is left out, as
    // brand/README.md says.
    x += glyph.advanceWidth * scale
    if (i < glyphs.length - 1) x += TRACKING
    return path
  })
  const boxes = paths.map((p) => p.getBoundingBox())
  return {
    d: paths.map((p) => p.toPathData({ decimalPlaces: 2, flipY: false })).join(' '),
    left: Math.min(...boxes.map((b) => b.x1)),
    right: Math.max(...boxes.map((b) => b.x2)),
  }
}

// The symbol's right edge sits at x 236, and its visual centre at y 128.
const baseline = 128 + (font.tables.os2.sCapHeight * scale) / 2
const firstPass = layoutWordmark(0, baseline)
const wordmark = layoutWordmark(236 + 44 - firstPass.left, baseline)
const logoWidth = Math.ceil(wordmark.right + 20)

function logoSvg(colors: LogoColors): string {
  return svgDocument(logoWidth, 256, [symbolGroup(FULL, colors), `  <path fill="${colors.wordmark}" d="${wordmark.d}"/>`].join('\n'))
}

const svgFiles = {
  'rabbitdock-symbol.svg': symbolSvg(FULL, palette.light),
  'rabbitdock-symbol-small.svg': symbolSvg(SMALL, palette.light),
  'rabbitdock-symbol-16.svg': symbolSvg(PIXEL16, palette.light),
  'rabbitdock-symbol-dark.svg': symbolSvg(FULL, palette.dark),
  'rabbitdock-symbol-small-dark.svg': symbolSvg(SMALL, palette.dark),
  'rabbitdock-symbol-16-dark.svg': symbolSvg(PIXEL16, palette.dark),
  'rabbitdock-symbol-mono-on-light.svg': symbolSvg(FULL, mono(palette.monoOnLight)),
  'rabbitdock-symbol-mono-on-dark.svg': symbolSvg(FULL, mono(palette.monoOnDark)),
  'rabbitdock-tray-on-light.svg': symbolSvg(SMALL, mono(palette.monoOnLight)),
  'rabbitdock-tray-on-light-16.svg': symbolSvg(PIXEL16, mono(palette.monoOnLight)),
  'rabbitdock-tray-on-dark.svg': symbolSvg(SMALL, mono(palette.monoOnDark)),
  'rabbitdock-tray-on-dark-16.svg': symbolSvg(PIXEL16, mono(palette.monoOnDark)),
  'rabbitdock-app-icon.svg': appIconSvg(APP_FULL),
  'rabbitdock-app-icon-small.svg': appIconSvg(APP_SMALL),
  'rabbitdock-app-icon-16.svg': appIconSvg(APP_PIXEL16),
  'rabbitdock-logo.svg': logoSvg(palette.light),
  'rabbitdock-logo-dark.svg': logoSvg(palette.dark),
} satisfies Record<string, string>

type SvgName = keyof typeof svgFiles

// For each PNG set, which SVG draws which size.
interface PngSet {
  dir: string
  name: string
  sizes: number[]
  pick: (size: number) => SvgName
}

const pngSets: PngSet[] = [
  { dir: 'symbol', name: 'rabbitdock-symbol', sizes: [16, 24, 32, 64, 128, 256, 512], pick: (s) => (s === 16 ? 'rabbitdock-symbol-16.svg' : s <= 24 ? 'rabbitdock-symbol-small.svg' : 'rabbitdock-symbol.svg') },
  { dir: 'symbol-dark', name: 'rabbitdock-symbol-dark', sizes: [16, 24, 32, 64, 128, 256, 512], pick: (s) => (s === 16 ? 'rabbitdock-symbol-16-dark.svg' : s <= 24 ? 'rabbitdock-symbol-small-dark.svg' : 'rabbitdock-symbol-dark.svg') },
  { dir: 'app-icon', name: 'rabbitdock-app-icon', sizes: [16, 24, 32, 48, 64, 128, 256, 512], pick: (s) => (s === 16 ? 'rabbitdock-app-icon-16.svg' : s <= 24 ? 'rabbitdock-app-icon-small.svg' : 'rabbitdock-app-icon.svg') },
  { dir: 'tray', name: 'rabbitdock-tray-on-light', sizes: [16, 22, 24, 32], pick: (s) => (s === 16 ? 'rabbitdock-tray-on-light-16.svg' : 'rabbitdock-tray-on-light.svg') },
  { dir: 'tray', name: 'rabbitdock-tray-on-dark', sizes: [16, 22, 24, 32], pick: (s) => (s === 16 ? 'rabbitdock-tray-on-dark-16.svg' : 'rabbitdock-tray-on-dark.svg') },
]

// Start from empty folders, so a file the script no longer makes shows up as deleted in git
// instead of lingering in brand/.
await rm(join(brandDir, 'svg'), { recursive: true, force: true })
await rm(join(brandDir, 'png'), { recursive: true, force: true })

await mkdir(join(brandDir, 'svg'), { recursive: true })
for (const [name, svg] of Object.entries(svgFiles)) {
  await writeFile(join(brandDir, 'svg', name), svg)
}

let pngCount = 0
for (const set of pngSets) {
  await mkdir(join(brandDir, 'png', set.dir), { recursive: true })
  for (const size of set.sizes) {
    const png = new Resvg(svgFiles[set.pick(size)], { fitTo: { mode: 'width', value: size } }).render().asPng()
    await writeFile(join(brandDir, 'png', set.dir, `${set.name}-${size}.png`), png)
    pngCount += 1
  }
}

console.log(`Wrote ${Object.keys(svgFiles).length} SVG and ${pngCount} PNG files to ${brandDir}`)
