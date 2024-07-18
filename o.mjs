// desc: Open any zoxide directory in Finder
const path = argv._.join(" ");

if (!path) {
	console.log(`Open any zoxide directory in Finder:\nUsage: o <path>`);
	process.exit(1);
}

const resolved = await $`zoxide query ${path}`.text();
console.log(`Open ${resolved}`);
await $`open ${resolved.trim()}`;
