/**
 * Cat all files matching a pattern
 * @usage [treecat <pattern1> [<pattern2>, ...]]
 */

const files = await glob(`**/*`, { cwd: process.cwd() });


function filter(file: string, include: string[], exclude: string[]) {
	if (file.includes('node_modules')) {
		return false;
	}
	if (include[0] === "." || include.length === 0) {
		return true;
	}
	if (exclude && typeof exclude === 'string') {
		const nots = exclude.split(",");
		for (const filter of nots) {
			if (file.includes(filter)) {
				return false;
			}
		}
	}
	for (const filter of include) {
		if (file.includes(filter)) {
			return true;
		}
	}
	return false;
}

const include = args;
const exclude = ['node_modules'];
const not = flags.not || flags.n;
if (not && typeof not === 'string') {
	exclude.push(...not.split(",").map(e => e.trim()));
}

let output = "";
const included: string[] = [];
const excluded: string[] = [];
for (const file of files) {
	const relPath = path.relative(process.cwd(), file);
	if (filter(relPath, include, exclude)) {
		included.push(relPath);
		output += `### File: ${relPath}\n`;
		const content = await Bun.file(file).text();
		output += `${content}\n`;
	} else {
		excluded.push(relPath);
	}
}

console.log("");
console.log(ansis.bold("Excluded:"), ansis.red(excluded.length));
console.log(excluded.join("\n"));
console.log("");
console.log(ansis.bold("Included:"), ansis.bold.green(included.length));
console.log(included.join("\n"));
console.log("")

// Copy output to clipboard
await $`echo ${output} | pbcopy`;
await $`wordcount --short > /dev/tty`;
export { }

