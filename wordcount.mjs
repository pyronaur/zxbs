#!/usr/bin/env zx
const text = await $`pbpaste`

console.log(chalk.gray("--------------------------------------------"))
const length = text.stdout.match(/[a-z][a-z']+/gi).length
console.log(chalk.bold("Word Count:"), chalk.bold.green(length))