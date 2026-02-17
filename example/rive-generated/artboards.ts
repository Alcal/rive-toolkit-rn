/**
 * Artboard names from the source Rive file.
 * Use with RiveView `artboard` prop or `artboardName` for type-safe artboard selection.
 */
export type RiveArtboardName = "Main";

/** All artboard names as a readonly tuple (for iteration or validation). */
export const RiveArtboardNames: readonly RiveArtboardName[] = ["Main"] as const;

/** Type guard: checks if `name` is a valid artboard name from this file. */
export function isRiveArtboardName(name: string): name is RiveArtboardName {
  return (RiveArtboardNames as readonly string[]).includes(name);
}
