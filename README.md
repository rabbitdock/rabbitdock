<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/svg/rabbitdock-logo-dark.svg">
    <img src="brand/svg/rabbitdock-logo.svg" alt="RabbitDock" width="360">
  </picture>
</p>

<p align="center">A modular desktop app for Windows and Linux.</p>

> [!NOTE]
> RabbitDock is in early development. For now it opens a window and little else.

## Development

Requires Node.js 26 or later.

```sh
npm install
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app, with HMR in the renderer |
| `npm run build` | Type-checks and builds into `out/` |
| `npm run preview` | Builds the app and starts the built version |
| `npm run typecheck` | Type-checks without building |
| `npm run test:smoke` | Opens the built app and checks that its window loads. Run `npm run build` first |
| `npm run brand` | Regenerates the logo and icon files in `brand/` |

The first command that starts the app downloads the Electron binary.

## Stack

Electron, React and TypeScript, built with electron-vite.

## License

MIT, see [LICENSE](LICENSE). The RabbitDock name, logo and icons are not covered by it, see
[brand/README.md](brand/README.md).
