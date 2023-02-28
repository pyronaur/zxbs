#!/usr/bin/env zx
const text = await $`pbpaste`

console.log(chalk.gray("\n--------------------------------------------"))
console.log(text);
console.log(chalk.gray("--------------------------------------------"))
const length = text.stdout.match(/[a-z][a-z']+/gi).length
// Word Count
console.log(chalk.bold("Word Count:"), chalk.bold.green(length))

// Character Count
console.log(chalk.bold("Character Count:"), chalk.bold.green(text.stdout.length))
