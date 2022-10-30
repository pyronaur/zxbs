#!/usr/bin/env zx
// If there's an uncommitted markdown file, commit it and push it to GitHub.

cd(`${os.homedir()}/Projects/Sites/pyronaur.com`)

// Get uncommitted markdown files
const uncommitted = await $`git status --porcelain`
const files = uncommitted.toString().split(`\n`).filter(Boolean)
if (files.length > 1) {
	console.log(`Extra uncommitted files found, aborting.`);
	process.exit(1);
}

// Get the file name
const [status, file] = files[0].split(` `);
if (status !== `??`) {
	console.log(`Uncommitted file found, aborting.`);
	process.exit(1);
}

// Get the file contents
const contents = await fs.readFile(file, `utf8`);

// Get the title
const title = contents.match(`title: (.*)`)[1];
const commit = `Add ${title}`;
await $`git add ${file}`;
await $`git commit -m ${commit}`;
await $`git push`