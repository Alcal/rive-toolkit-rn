/**
 * Resolve artboard names from a .riv file.
 * Tries @rive-app/canvas (Rive runtime) first; falls back to optional binary parser.
 */

const fs = require('fs');
const path = require('path');

/**
 * Get artboard names using @rive-app/canvas runtime (loads .riv and reads artboard list).
 * Requires a runtime environment where Rive WASM can run (browser or Node).
 * @param {string} rivPath - Absolute or relative path to .riv file
 * @returns {Promise<string[]>} Artboard names
 */
async function getArtboardNamesFromRuntime(rivPath) {
  try {
    const absolutePath = path.isAbsolute(rivPath) ? rivPath : path.resolve(process.cwd(), rivPath);
    const buffer = fs.readFileSync(absolutePath);
    const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    const rive = await import('@rive-app/canvas').catch(() => null);
    if (!rive || !rive.RiveFile) return null;

    if (rive.RuntimeLoader && typeof rive.RuntimeLoader.awaitInstance === 'function') {
      await rive.RuntimeLoader.awaitInstance().catch(() => null);
    }
    const riveFile = new rive.RiveFile({ buffer: bytes.buffer });
    await riveFile.init().catch(() => null);

    const file = riveFile.getInstance && riveFile.getInstance();
    if (!file || typeof file.artboardCount !== 'function') return null;

    const count = file.artboardCount();
    const names = [];
    for (let i = 0; i < count; i++) {
      try {
        const artboard = file.artboardByIndex(i);
        if (artboard && artboard.name != null) names.push(artboard.name);
      } catch (_) {
        // skip
      }
    }
    if (typeof riveFile.cleanup === 'function') riveFile.cleanup();
    const nonEmpty = names.filter((n) => n != null && String(n).trim() !== '');
    return nonEmpty.length ? nonEmpty : null;
  } catch (_) {
    return null;
  }
}

/**
 * Get artboard names using the minimal binary parser (best-effort).
 * @param {string} rivPath - Path to .riv file
 * @returns {{ artboardNames: string[] } | null}
 */
function getArtboardNamesFromParser(rivPath) {
  try {
    const { parseRivFile } = require('./rivParser.js');
    const absolutePath = path.isAbsolute(rivPath) ? rivPath : path.resolve(process.cwd(), rivPath);
    const buffer = fs.readFileSync(absolutePath);
    const result = parseRivFile(buffer);
    return result.artboardNames && result.artboardNames.length ? result : null;
  } catch (_) {
    return null;
  }
}

/**
 * Resolve artboard names from a .riv file.
 * Tries runtime first, then binary parser.
 * @param {string} rivPath - Path to .riv file
 * @returns {Promise<string[]>} Artboard names, or empty array if resolution failed
 */
async function getArtboardNames(rivPath) {
  const fromRuntime = await getArtboardNamesFromRuntime(rivPath);
  if (fromRuntime && fromRuntime.length) return fromRuntime;

  const fromParser = getArtboardNamesFromParser(rivPath);
  if (fromParser && fromParser.artboardNames && fromParser.artboardNames.length) {
    const names = fromParser.artboardNames.filter((n) => n != null && String(n).trim() !== '');
    if (names.length) return names;
  }

  return [];
}

module.exports = { getArtboardNames, getArtboardNamesFromRuntime, getArtboardNamesFromParser };
