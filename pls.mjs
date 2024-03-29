// List all the scripts defined in the package.json file
if (!await Bun.file('./package.json').exists()) {
	console.log("Can't find package.json in the current directory");
	process.exit(1);
}

const json = await Bun.file('./package.json').json();

console.log(json);

if (!json.scripts) {
	console.log("No scripts found in package.json");
	console.log("Only found keys: " + Object.keys(json).join(", "));
	process.exit(1);
}

for (const script of Object.keys(json.scripts)) {
	const command = json.scripts[script];
	console.log(chalk.bold(script) + "\n" + command);
	console.log();
}