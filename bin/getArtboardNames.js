/**
 * Resolve artboard names and state machine info from a .riv file using @rive-app/canvas.
 * In Node (no document), uses Puppeteer to run the Rive runtime in headless Chrome.
 */

const fs = require('fs');
const path = require('path');

const RIVE_CANVAS_UNPKG = 'https://unpkg.com/@rive-app/canvas@2.35.0/rive.js';

/**
 * Extract artboard and state machine names by running the Rive runtime in a headless browser.
 * @param {string} absolutePath - Absolute path to .riv file
 * @param {string} rivBase64 - File contents as base64
 * @returns {Promise<{ artboardNames: string[], stateMachinesByArtboard: Record<string, string[]> } | null>}
 */
async function extractWithHeadlessBrowser(absolutePath, rivBase64) {
  let browser;
  try {
    const puppeteer = await import('puppeteer').catch(() => null);
    if (!puppeteer || !puppeteer.default) {
      console.warn('[getArtboardNames] Puppeteer not available. Install with: npm install puppeteer');
      return null;
    }
    browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(
      `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script src="${RIVE_CANVAS_UNPKG}"></script>
</body></html>`,
      { waitUntil: 'networkidle0', timeout: 30000 }
    );
    await page.waitForFunction(
      () => typeof window.rive !== 'undefined' && window.rive.RiveFile,
      { timeout: 15000 }
    );
    const result = await page.evaluate(
      async (base64) => {
        const rive = window.rive;
        if (!rive || !rive.RiveFile) return null;
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        try {
          if (rive.RuntimeLoader && typeof rive.RuntimeLoader.awaitInstance === 'function') {
            await rive.RuntimeLoader.awaitInstance();
          }
          const riveFile = new rive.RiveFile({ buffer: bytes.buffer });
          await riveFile.init();
          const file = riveFile.getInstance && riveFile.getInstance();
          if (!file || typeof file.artboardCount !== 'function') return null;
          const names = [];
          const stateMachinesByArtboard = {};
          const count = file.artboardCount();
          for (let i = 0; i < count; i++) {
            const artboard = file.artboardByIndex(i);
            if (artboard && artboard.name != null) {
              const artboardName = artboard.name;
              names.push(artboardName);
              if (typeof artboard.stateMachineCount === 'function') {
                const smNames = [];
                for (let j = 0; j < artboard.stateMachineCount(); j++) {
                  const sm = artboard.stateMachineByIndex && artboard.stateMachineByIndex(j);
                  if (sm && sm.name != null) smNames.push(sm.name);
                }
                if (smNames.length) stateMachinesByArtboard[artboardName] = smNames;
              }
            }
          }
          if (riveFile.cleanup) riveFile.cleanup();
          const nonEmpty = names.filter((n) => n != null && String(n).trim() !== '');
          return nonEmpty.length ? { artboardNames: nonEmpty, stateMachinesByArtboard } : null;
        } catch (e) {
          return null;
        }
      },
      rivBase64
    );
    return result;
  } catch (err) {
    console.warn('[getArtboardNames] Headless browser extraction failed:', err.message);
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

/**
 * Load the .riv file with the Rive runtime and extract artboard names and state machine names per artboard.
 * Uses in-process @rive-app/canvas when rive is provided and document exists; otherwise uses headless Chrome via Puppeteer.
 *
 * @param {string} rivPath - Absolute or relative path to .riv file
 * @param {object|null} rive - Loaded @rive-app/canvas module (from generate.js), or null to use headless browser
 * @returns {Promise<{ artboardNames: string[], stateMachinesByArtboard: Record<string, string[]> } | null>}
 */
async function getArtboardNames(rivPath, rive) {
  const absolutePath = path.isAbsolute(rivPath) ? rivPath : path.resolve(process.cwd(), rivPath);
  let buffer;
  try {
    buffer = fs.readFileSync(absolutePath);
  } catch (err) {
    console.warn('[getArtboardNames] Failed to read file:', absolutePath, err.message);
    return null;
  }
  const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const rivBase64 = Buffer.from(bytes).toString('base64');

  const useHeadless = !rive || !rive.RiveFile;
  if (useHeadless) {
    if (typeof globalThis.document === 'undefined') {
      console.warn('[getArtboardNames] No document (Node.js). Using headless browser to load .riv.');
    }
    return extractWithHeadlessBrowser(absolutePath, rivBase64);
  }

  let riveFile;
  try {
    if (rive.RuntimeLoader && typeof rive.RuntimeLoader.awaitInstance === 'function') {
      await rive.RuntimeLoader.awaitInstance();
    }
    riveFile = new rive.RiveFile({ buffer: bytes.buffer });
    await riveFile.init();

    const file = riveFile.getInstance && riveFile.getInstance();
    if (!file || typeof file.artboardCount !== 'function') {
      console.warn('[getArtboardNames] Rive file has no artboard API (getInstance/artboardCount).');
      return null;
    }

    const count = file.artboardCount();
    const names = [];
    const stateMachinesByArtboard = {};
    for (let i = 0; i < count; i++) {
      try {
        const artboard = file.artboardByIndex(i);
        if (artboard && artboard.name != null) {
          const artboardName = artboard.name;
          names.push(artboardName);
          if (typeof artboard.stateMachineCount === 'function') {
            const smCount = artboard.stateMachineCount();
            const smNames = [];
            for (let j = 0; j < smCount; j++) {
              try {
                const sm = artboard.stateMachineByIndex && artboard.stateMachineByIndex(j);
                if (sm && sm.name != null) smNames.push(sm.name);
              } catch (_) {
                // skip
              }
            }
            if (smNames.length) stateMachinesByArtboard[artboardName] = smNames;
          }
        }
      } catch (_) {
        // skip
      }
    }
    const nonEmpty = names.filter((n) => n != null && String(n).trim() !== '');
    if (nonEmpty.length === 0) {
      console.warn('[getArtboardNames] File has no named artboards.');
      return null;
    }
    return { artboardNames: nonEmpty, stateMachinesByArtboard };
  } catch (err) {
    console.warn('[getArtboardNames] Runtime error (WASM/init/parse):', err.message);
    return extractWithHeadlessBrowser(absolutePath, rivBase64);
  } finally {
    if (riveFile && typeof riveFile.cleanup === 'function') riveFile.cleanup();
  }
}

module.exports = { getArtboardNames, extractWithHeadlessBrowser };
