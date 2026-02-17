/**
 * Generate script – generates a TypeScript suite from a .riv file.
 * Invoked via: npx rive-toolkit-rn generate --src <path-to.riv> --out <output-dir>
 *
 * Options:
 *   --src <path>   Path to the source .riv file (required unless --artboards is set)
 *   --out <path>   Output directory for generated TypeScript files (required)
 *   --artboards <names>  Comma-separated artboard names (optional override/fallback)
 *   --name <base>  Base name for generated types (default: RiveArtboard)
 */

const path = require('path');
const { getArtboardNames } = require('./getArtboardNames.js');
const { generateArtboardTypes } = require('./generateArtboardTypes.js');

function parseArgs(argv) {
  const args = { src: null, out: null, artboards: null, name: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--src' && argv[i + 1]) args.src = argv[i + 1];
    if (argv[i] === '--out' && argv[i + 1]) args.out = argv[i + 1];
    if (argv[i] === '--artboards' && argv[i + 1]) args.artboards = argv[i + 1];
    if (argv[i] === '--name' && argv[i + 1]) args.name = argv[i + 1];
  }
  return args;
}

async function generate() {
  const argv = process.argv.slice(2);
  const { src, out, artboards: artboardsArg, name: baseName } = parseArgs(argv);

  if (!out) {
    console.error('Usage: rive-toolkit-rn generate --src <path-to.riv> --out <output-dir>');
    console.error('   or: rive-toolkit-rn generate --out <output-dir> --artboards "Name1,Name2"');
    console.error('Options:');
    console.error('  --src <path>     Path to the source .riv file');
    console.error('  --out <path>     Output directory for generated TypeScript files (required)');
    console.error('  --artboards <names>  Comma-separated artboard names (optional override)');
    console.error('  --name <base>    Base name for generated types (default: RiveArtboard)');
    process.exit(1);
  }

  let artboardNames = [];
  if (artboardsArg) {
    artboardNames = artboardsArg.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (artboardNames.length === 0 && src) {
    const resolved = path.isAbsolute(src) ? src : path.resolve(process.cwd(), src);
    artboardNames = await getArtboardNames(resolved);
    if (artboardNames.length === 0) {
      console.warn('Could not read artboard names from', src);
      console.warn('Install @rive-app/canvas (dev) for runtime-based extraction, or pass --artboards "Name1,Name2"');
    }
  }
  if (artboardNames.length === 0 && !artboardsArg) {
    console.error('No artboards to generate.');
    if (src) {
      console.error('Could not extract artboard names from:', src);
      console.error('Try: --artboards "Artboard1,Artboard2" to generate types manually.');
    } else {
      console.error('Provide --src <path-to.riv> or --artboards "A,B,C".');
    }
    process.exit(1);
  }

  const outDir = path.isAbsolute(out) ? out : path.resolve(process.cwd(), out);
  const result = generateArtboardTypes(outDir, artboardNames, { baseName: baseName || undefined });

  console.log('Generated', result.files.length, 'files in', outDir);
  result.files.forEach((f) => console.log('  -', f));
  console.log('Artboards:', result.artboardNames.join(', '));
}

function run() {
  generate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { generate, run };
