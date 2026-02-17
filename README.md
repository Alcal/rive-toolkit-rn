# rive-toolkit-rn

A React Native toolkit for [Rive](https://rive.app) animations — higher-level components, hooks, and utilities built on top of `rive-react-native`.

## Installation

```bash
npm install rive-toolkit-rn rive-react-native
```

> **Peer dependencies:** `react >= 18`, `react-native >= 0.72`, `rive-react-native >= 6`.

## Quick Start

```tsx
import { RiveAnimation } from "rive-toolkit-rn";

export default function App() {
  return <RiveAnimation source="hero" stateMachineName="Main" />;
}
```

## Hooks

### `useRive`

Manages a Rive instance and exposes imperative play/pause/stop controls.

```tsx
import { RiveAnimation, useRive } from "rive-toolkit-rn";

function Player() {
  const { riveRef, riveProps, play, pause } = useRive({ source: "hero" });
  return <RiveAnimation ref={riveRef} {...riveProps} />;
}
```

### `useStateMachine`

Simplifies driving Rive state machine inputs from React.

```tsx
import { RiveAnimation, useStateMachine } from "rive-toolkit-rn";

function Interactive() {
  const { riveRef, setBoolInput, fireTrigger, onStateChanged } =
    useStateMachine({ stateMachineName: "Main" });

  return (
    <RiveAnimation
      ref={riveRef}
      source="interactive"
      stateMachineName="Main"
      onStateChanged={onStateChanged}
    />
  );
}
```

## Generate types from a .riv file

The CLI can generate a TypeScript suite (types and constants) from a Rive file’s **artboards**, so you can use type-safe artboard names with `RiveView` (e.g. `artboard` / `artboardName`).

```bash
npx rive-toolkit-rn generate --src path/to/file.riv --out path/to/generated
```

- **`--src`** – Path to the source `.riv` file. If artboard names cannot be extracted (e.g. in Node without a Rive runtime), use `--artboards` instead.
- **`--out`** – Output directory for generated files (required).
- **`--artboards "Name1,Name2"`** – Comma-separated artboard names (optional; use when `--src` extraction is not available).
- **`--name <base>`** – Base name for generated types (default: `RiveArtboard`).

Generated files:

- **`artboards.ts`** – `ArtboardName` union type, `ArtboardNames` array, and `isArtboardName()` type guard.
- **`artboardNames.ts`** – Named constants per artboard and `ArtboardId` type.
- **`index.ts`** – Re-exports the suite.

Example usage in your app:

```tsx
import { RiveView, useRiveFile } from "@rive-app/react-native";
import { Main, ExampleRiveName } from "./generated";

const { riveFile } = useRiveFile(require("./file.riv"));
return <RiveView file={riveFile} artboard={Main} />;
```

For extraction from `.riv`, the CLI tries the Rive runtime first (requires `@rive-app/canvas` as a dev dependency). If that fails, use `--artboards "A,B,C"` with the names from the Rive editor.

## API

| Export                | Kind      | Description                                  |
| --------------------- | --------- | -------------------------------------------- |
| `RiveAnimation`       | Component | Drop-in Rive player with sensible defaults   |
| `useRive`             | Hook      | Imperative animation controls                |
| `useStateMachine`     | Hook      | State machine input helpers                  |
| `preloadRive`         | Utility   | Register a source as preloaded               |
| `clearRiveCache`      | Utility   | Clear the preload cache                      |
| `resolveRiveSource`   | Utility   | Normalise various source formats to a string |

## License

MIT
