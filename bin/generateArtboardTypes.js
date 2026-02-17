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
 * @param {{ baseName?: string, stateMachinesByArtboard?: Record<string, string[]> }} options - Optional base name and state machine info
 */
function generateArtboardTypes(outDir, artboardNames, options = {}) {
  const baseName = options.baseName || 'RiveArtboard';
  const stateMachinesByArtboard = options.stateMachinesByArtboard || {};
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

  const files = ['artboards.ts', 'artboardNames.ts'];
  let stateMachineNames = [];
  let indexExports = `export type { ${baseName}Name } from './artboards';
export { ${baseName}Names, is${baseName}Name } from './artboards';
export type { ${baseName}Id } from './artboardNames';
export { ${safeNames.join(', ')} } from './artboardNames';
`;

  // 3) State machine names and per-artboard mapping (when available)
  const allStateMachineNames = [...new Set(Object.values(stateMachinesByArtboard).flat())];
  if (allStateMachineNames.length > 0) {
    stateMachineNames = allStateMachineNames.sort();
    const smUnion = stateMachineNames.map((n) => JSON.stringify(n)).join(' | ');
    const smBaseName = baseName.replace(/Artboard$/, '') || 'Rive';
    const stateMachinesContent = `/**
 * State machine names from the source Rive file.
 * Use with RiveView \`stateMachineName\` prop for type-safe state machine selection.
 */
import type { ${baseName}Name } from './artboards';

export type ${smBaseName}StateMachineName = ${smUnion};

/** All state machine names as a readonly tuple. */
export const ${smBaseName}StateMachineNames: readonly ${smBaseName}StateMachineName[] = ${JSON.stringify(stateMachineNames)} as const;

/** Type guard: checks if \`name\` is a valid state machine name from this file. */
export function is${smBaseName}StateMachineName(name: string): name is ${smBaseName}StateMachineName {
  return (${smBaseName}StateMachineNames as readonly string[]).includes(name);
}

/** State machine names per artboard (for type-safe \`stateMachineName\` when artboard is known). */
export const stateMachinesByArtboard: Partial<Record<${baseName}Name, readonly ${smBaseName}StateMachineName[]>> = ${JSON.stringify(stateMachinesByArtboard, null, 2)} as const;
`;

    fs.writeFileSync(path.join(outDir, 'stateMachines.ts'), stateMachinesContent, 'utf8');
    files.push('stateMachines.ts');
    indexExports += `
export type { ${smBaseName}StateMachineName } from './stateMachines';
export { ${smBaseName}StateMachineNames, is${smBaseName}StateMachineName, stateMachinesByArtboard } from './stateMachines';
`;
  }

  // 4) Index that re-exports the suite
  const indexContent = `/**
 * Generated Rive types and constants for React Native (RiveView).
 * Source: artboard and state machine names from the linked .riv file.
 */
${indexExports}
`;

  fs.writeFileSync(path.join(outDir, 'index.ts'), indexContent, 'utf8');
  files.push('index.ts');

  return { artboardNames, stateMachineNames, files };
}

module.exports = { generateArtboardTypes, toIdentifier };
