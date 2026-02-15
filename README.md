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
