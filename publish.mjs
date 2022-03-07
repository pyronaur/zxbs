#!/usr/bin/env zx
const file = argv._[1];

if (!file) {
	throw new Error("You must specify a file to publish\nUsage: publish <file>");
}

if (! await fs.pathExistsSync('publish.yml')) {
	throw new Error("Can't find publish.yml");
}

if (! await fs.pathExistsSync(file)) {
	throw new Error(`Can't find the file to publish: "${file}"`);
}

const publish = YAML.parse(await fs.readFile('publish.yml', 'utf8'));

if (!publish.destination) {
	throw new Error("Can't find the publish destination");
}

fs.ensureDirSync(publish.destination);
const filename = path.basename(file);
const destFile = `${publish.destination}/${filename} `;
console.log(`Copying ${filename} to ${destFile}`);
await fs.copy(file, destFile);