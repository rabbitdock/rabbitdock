# RabbitDock brand

The symbol is a rabbit peeking out of a cradle cut into the dock. The gap between the rabbit and the
dock is part of the drawing, so the symbol also works in a single color.

## Palette

| Use | Rabbit | Dock and wordmark |
|---|---|---|
| On light backgrounds | `#607F9E` | `#262B33` |
| On dark backgrounds | `#86A0BC` | `#CDD2D9` |
| Monochrome on light | `#262B33` | `#262B33` |
| Monochrome on dark | `#E8EBEF` | `#E8EBEF` |
| App icon, on a `#262B33` tile | `#86A0BC` | `#CDD2D9` |

The colors were chosen against `#FFFFFF` and `#F3F4F6` for light backgrounds and `#111316` for dark
ones. The app icon carries its own graphite tile, so it reads on light and dark taskbars alike. The
tile fills the whole square at 16 and 24 px, to give the symbol every pixel, and keeps a small
transparent margin from 32 px up.

## Drawings

The symbol has three drawings, each for a size range.

- **Full**, for 32 px and up.
- **Small**, for 22 and 24 px, with thicker ears and a wider gap. The tray icons use it at 32 px
    too, since a tray icon stays small on screen.
- **16 px**, drawn on the pixel grid so its edges stay sharp. The ears step out by one pixel instead
    of leaning.

## Files

| File | Use |
|---|---|
| `svg/rabbitdock-app-icon.svg`, `-small.svg`, `-16.svg` | App icon on its tile, in the three drawings |
| `svg/rabbitdock-symbol.svg`, `-small.svg`, `-16.svg` | Color symbol for light backgrounds |
| `svg/rabbitdock-symbol-dark.svg`, `-dark-small.svg`, `-dark-16.svg` | Color symbol for dark backgrounds |
| `svg/rabbitdock-symbol-mono-on-light.svg`, `-mono-on-dark.svg` | Single color, full drawing |
| `svg/rabbitdock-tray-on-light.svg`, `-on-dark.svg`, and their `-16` versions | Single color, for the system tray |
| `svg/rabbitdock-logo.svg`, `svg/rabbitdock-logo-dark.svg` | Symbol with the wordmark |
| `png/app-icon/` | 16, 24, 32, 48, 64, 128, 256 and 512 px |
| `png/symbol/`, `png/symbol-dark/` | 16, 24, 32, 64, 128, 256 and 512 px |
| `png/tray/` | 16, 22, 24 and 32 px, on light and on dark |

The tray and symbol PNG files have a transparent background. Each PNG uses the drawing made for its
size.

## Wordmark

The wordmark is Inter Display SemiBold with -2.5% tracking, converted to outlines, so the logo files
do not need the font. The outlines were set without the font's kerning pairs. The font is in `fonts/`.

## Regenerating

`npm run brand` deletes `svg/` and `png/` and generates them again from the drawings and the
palette in `scripts/build-brand.mts`. Change them there, not in the generated files.

## License

The code in this repository is under the MIT license. The RabbitDock name, the logo and the icons in
this folder are not covered by it, and neither are the drawings in `scripts/build-brand.mts` that
generate them. You may use them to refer to RabbitDock, but not as the name or logo of another
project. The Inter font in `fonts/` is under the SIL Open Font License 1.1, in
`fonts/LICENSE-Inter.txt`.
