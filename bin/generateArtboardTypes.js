/**
 * Generates TypeScript types and constants from a list of artboard names.
 * Used by the generate command after resolving artboard names from --src or --artboards.
 */

const fs = require('fs');
const path = require('path');

/**
 * Sanitize a string for use as a TypeScript identifier (type name or const).
 * Replaces spaces and special chars with nothing or underscore; ensures it doesn't start with a number.
 */
function toIdentifier(name) {
  if (!name || typeof name !== 'string') return 'Unnamed';
  const s = name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'Unnamed';
  return /^[0-9]/.test(s) ? '_' + s : s;
}

/**
 * Generate the TypeScript suite into outDir.
 * @param {string} outDir - Output directory (created if needed)
 * @param {string[]} artboardNames - List of artboard names from the .riv file
 * @param {{ baseName?: string }} options - Optional base name for generated types
 */
function generateArtboardTypes(outDir, artboardNames, options = {}) {
  const baseName = options.baseName || 'RiveArtboard';
  const safeNames = artboardNames.map(toIdentifier);

  fs.mkdirSync(outDir, { recursive: true });

  // 1) Artboard names as string literal union type
  const unionMembers = artboardNames.map((n) => JSON.stringify(n)).join(' | ');
  const typeContent = `/**
 * Artboard names from the source Rive file.
 * Use with RiveView \`artboard\` prop or \`artboardName\` for type-safe artboard selection.
 */
export type ${baseName}Name = ${unionMembers};

/** All artboard names as a readonly tuple (for iteration or validation). */
export const ${baseName}Names: readonly ${baseName}Name[] = ${JSON.stringify(artboardNames)} as const;

/** Type guard: checks if \`name\` is a valid artboard name from this file. */
export function is${baseName}Name(name: string): name is ${baseName}Name {
  return (${baseName}Names as readonly string[]).includes(name);
}
`;

  fs.writeFileSync(path.join(outDir, 'artboards.ts'), typeContent, 'utf8');

  // 2) Per-artboard constants and optional component helpers (for future use)
  const constantsLines = [
    '/**',
    ' * Artboard name constants for use with RiveView artboard prop.',
    ' * Generated from the source .riv file.',
    ' */',
    ...safeNames.map((id, i) => `export const ${id} = ${JSON.stringify(artboardNames[i])} as const;`),
    '',
    `export type ${baseName}Id = ${safeNames.map((id) => `typeof ${id}`).join(' | ')};`,
  ];
  fs.writeFileSync(path.join(outDir, 'artboardNames.ts'), constantsLines.join('\n'), 'utf8');

  // 3) Index that re-exports the suite
  const indexContent = `/**
 * Generated Rive types and constants for React Native (RiveView).
 * Source: artboard names from the linked .riv file.
 */
export type { ${baseName}Name } from './artboards';
export { ${baseName}Names, is${baseName}Name } from './artboards';
export type { ${baseName}Id } from './artboardNames';
export { ${safeNames.join(', ')} } from './artboardNames';
`;

  fs.writeFileSync(path.join(outDir, 'index.ts'), indexContent, 'utf8');

  return { artboardNames, files: ['artboards.ts', 'artboardNames.ts', 'index.ts'] };
}

module.exports = { generateArtboardTypes, toIdentifier };
