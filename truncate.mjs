#!/usr/bin/env zx
const file = argv._[0];

if (!file) {
  console.log("Usage: truncate <file>");
  exit(1);
}

console.log(`Truncating ${file}`);
const shouldTruncate = confirm(`Continue? (Y/n) `);
if (shouldTruncate.toLowerCase() === "n") {
  exit(0);
}

fs.writeFileSync(file, "");