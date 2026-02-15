#!/usr/bin/env node

const command = process.argv[2];

if (!command) {
  console.error('Usage: rive-toolkit-rn <command>');
  console.error('Commands: generate');
  process.exit(1);
}

switch (command) {
  case 'generate':
    require('./generate').run();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Commands: generate');
    process.exit(1);
}
