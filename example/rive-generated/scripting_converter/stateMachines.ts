/**
 * State machine names from the source Rive file.
 * Use with RiveView `stateMachineName` prop for type-safe state machine selection.
 */
import type { RiveArtboardName } from './artboards';

export type RiveStateMachineName = "State Machine 1";

/** All state machine names as a readonly tuple. */
export const RiveStateMachineNames: readonly RiveStateMachineName[] = ["State Machine 1"] as const;

/** Type guard: checks if `name` is a valid state machine name from this file. */
export function isRiveStateMachineName(name: string): name is RiveStateMachineName {
  return (RiveStateMachineNames as readonly string[]).includes(name);
}

/** State machine names per artboard (for type-safe `stateMachineName` when artboard is known). */
export const stateMachinesByArtboard: Partial<Record<RiveArtboardName, readonly RiveStateMachineName[]>> = {
  "Main": [
    "State Machine 1"
  ],
  "OrderButton": [
    "State Machine 1"
  ],
  "Fees": [
    "State Machine 1"
  ],
  "TipGrid": [
    "State Machine 1"
  ],
  "TipIcon": [
    "State Machine 1"
  ],
  "Tip Button": [
    "State Machine 1"
  ],
  "Arrow": [
    "State Machine 1"
  ],
  "Card": [
    "State Machine 1"
  ],
  "CardIcon": [
    "State Machine 1"
  ],
  "Switch": [
    "State Machine 1"
  ]
} as const;
