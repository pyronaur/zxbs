#!/usr/bin/env zx
const path = argv._.join(' ')

if( !path ) {
  console.log(`Usage`)
  process.exit(1);
}

const resolved = await $`zoxide query ${path}`
console.log(`Open ${resolved}`);
await $`open ${resolved}`