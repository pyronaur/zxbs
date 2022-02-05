#!/usr/bin/env zx
// List all the scripts defined in the package.json file

if( ! fs.pathExistsSync( './package.json')) {
	console.log("Can't find package.json in the current directory");
	process.exit(1);
}

const contents = await fs.readFile('./package.json', 'utf8');
const json = JSON.parse(contents);

for( const script of Object.keys( json.scripts ) ) {
	const command = json.scripts[script];
	console.log(chalk.bold(script) + "\n" + command);
	console.log();
}