#!/usr/bin/env zx
const path = argv._.join(' ')

if( !path ) {
  console.log(`Open any zoxide directory in Finder:\nUsage: o <path>`);
  process.exit(1);
}

const resolved = await $`zoxide query ${path}`
console.log(`Open ${resolved}`);
await $`open ${resolved}`