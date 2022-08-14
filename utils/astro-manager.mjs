import {
	confirm,
	fuzzySelect,
} from './helpers.mjs';

/**
 * 
 * 
 * 
 * 
 * 
 * Setup commands
 * 
 * 
 * 
 * 
 * 
 */
function fileTemplate(name) {
	const title = name.split(/[-_]/).map(str => str.charAt(0).toUpperCase() + str.slice(1)).join(" ");
	const date = new Date().toISOString().split("T")[0];
	return `---
	title: ${title} 
	preview: A new draft has been created.
	date: ${date} 
	---

	## Heading
	
	Post content.


	`	// trim leading tabs
		.replace(/^\t+/gm, '');
}

async function edit(file) {
	await $`open -a Focused ${file}`
}

function readInput(commands) {

	// blog -o some-slug
	// blog -l
	// etc.
	const shortcut = commands
		.filter(cmd => cmd.shortcut)
		.find(cmd => argv[cmd.shortcut]);

	if (shortcut) {
		console.log(shortcut)
		return {
			command: shortcut,
			arg: argv[shortcut.shortcut]
		}
	}

	// blog open some-slug
	// blog ls
	// etc.
	const name = commands.find(cmd => argv._[1] === cmd.name);
	if (name) {
		return {
			command: name,
			arg: argv._[2],
		}
	}

	// Assume we're trying to open a blog post.
	// blog some-slug
	if (argv._.length === 2) {
		return {
			command: commands.find(cmd => cmd.name === 'open'),
			arg: argv._[1]
		}
	}

	// Return the second argument
	return false;
}

async function command_draft(name, { drafts }) {
	const draft = `${drafts}/${name}.md`;
	if (fs.pathExistsSync(draft)) {
		await edit(draft);
		return;
	}

	try {
		const template = fileTemplate(name);
		await fs.ensureDir( path.dirname(draft) );
		await fs.writeFile(draft, template, { encoding: 'utf8' });
	} catch (err) {
		console.log(err);
		return;
	}

	await edit(draft);
}

async function command_open(name, args) {
	console.log(name)

	if (!name || typeof name !== 'string') {
		throw new Error(`Which post to open?`)
	}

	const { content } = args;
	if (name === '.') {
		return await $`open ${content}`
	}
	const posts = await globby(`${content}/**/*.md`);
	const message = `\nFound multiple posts matching "${chalk.bold(name)}"\nWhich post you want to edit?`
	const post = await fuzzySelect(name, posts, message);

	if (!post) {
		console.log(`Can't find any posts matching "${chalk.bold(name)}" `);
		if (await confirm(`Would you like to create new draft called "${name}"?`)) {
			await command_draft(name, args);
		}
		return;
	}

	edit(post);
}

async function command_publish(needle, { drafts, content }) {

	const message = `\nFound multiple posts matching "${chalk.bold(needle)}"\nWhich post you want to publish?`
	const files = await globby(`${drafts}/*.md`);
	const draft = await fuzzySelect(needle, files, message);

	const currentYear = new Date().getFullYear();
	const publishDirectory = `${content}/${currentYear}`;
	await fs.ensureDir(publishDirectory);
	await $`mv ${draft} ${publishDirectory}`;
}

async function command_run(_unused, { site }) {
	await $`cd ${site} && npm run dev`
}

async function command_list(_unused, { content, drafts }) {
	$.verbose = false;
	console.log(chalk.bold("## Drafts"));
	await $`tree -P '*.md' '${drafts}'`.pipe(process.stdout)

	console.log("\n")

	console.log(chalk.bold("## Posts"));
	await $`tree -P '*.md' '${content}' -I 'drafts'`.pipe(process.stdout)
}

// Edit the Astro site in VSCode
async function command_edit(name, { site }) {
	await $`open -a "Visual Studio Code" ${site}`
}

// Command to get the site path
async function command_path(name, { site }) {
	console.log(site)
}

export async function AstroManager(name, site) {

	try {

		const commands = [
			{
				name: 'run',
				shortcut: 'r',
				action: command_run
			},

			{
				name: 'ls',
				shortcut: 'l',
				action: command_list
			},
			{
				name: 'draft',
				shortcut: 'd',
				action: command_draft
			},
			{
				name: 'publish',
				shortcut: 'p',
				action: command_publish
			},
			{
				name: 'open',
				shortcut: 'o',
				action: command_open
			},
			{
				name: 'edit',
				shortcut: 'e',
				action: command_edit
			},
			{
				name: 'path',
				shortcut: '',
				action: command_path
			},
		];

		const { command, arg } = readInput(commands);

		const content = `${site}/src/content`
		const drafts = `${site}/src/content/drafts`

		if (!command) {
			throw new Error('Which command should I run?');
		}

		await command.action(arg, {
			site,
			content,
			drafts,
		});


	} catch (err) {
		console.error(err.message);
		console.log(
			`
> Usage:
Open ${name} directory:
	${name} open .

Create a new draft:
	${name} <draft_name>
	${name} -d <draft_name>
	${name} draft <draft_name>

Edit any post or draft:
	${name} <name>
	${name} -o <name>
	${name} open <name>

Move draft to published directory:
	${name} -p <draft_name>
	${name} publish <draft_name>

Run Astro
	${name} run
	${name} -r

List Posts
	${name} ls
	${name} -l

Edit Site
	${name} edit
	${name} -e

Show Site Path
	${name} path
`
		)
	}

}