#!/usr/bin/env zx
// Regex match anything piped to this command.

$.verbose = false;
const stdin = await $`cat /dev/stdin`;
const pattern = argv._[1];
const item = argv._[2] ?? false

const flags = argv.flags || 'gm'
const result = stdin.stdout.match(new RegExp(pattern, flags));
if (!result) {
	console.log(stdin);
}

let output;

if (item !== false) {
	output = result[item]
	console.log(output)
} else {
	JSON.stringify(result, null, 4)
}
