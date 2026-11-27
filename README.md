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
| `npm run build:module -- <folder>` | Builds the module in that folder into `out/modules/<id>/`, apart from the app |
| `npm run preview` | Builds the app and starts the built version |
| `npm run typecheck` | Type-checks without building |
| `npm run lint` | Checks the code with Oxlint |
| `npm run test:unit` | Runs the unit tests with Vitest |
| `npm run test:smoke` | Opens the built app and checks that its window loads, that it loads an installed example module and that it stays locked down. Run `npm run build` first |
| `npm run dist` | Builds and packages the app for the current system into `dist/`, as an installer on Windows and an AppImage on Linux |
| `npm run brand` | Regenerates the logo and icon files in `brand/` |

The first command that starts the app downloads the Electron binary. To run the smoke test against
the packaged app, set `RABBITDOCK_EXECUTABLE` to its executable, such as
`dist/win-unpacked/RabbitDock.exe`.

## Stack

Electron, React and TypeScript, built with electron-vite and styled with Tailwind CSS.

## License

MIT, see [LICENSE](LICENSE). The RabbitDock name, logo, icons and the drawings that generate them
are not covered by it, and the Inter font is under the SIL Open Font License. See
[brand/README.md](brand/README.md).
