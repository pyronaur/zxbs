import { confirm, fuzzySelect } from "./helpers.mjs";

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
	const title = name
		.split(/[-_]/)
		.map((str) => str.charAt(0).toUpperCase() + str.slice(1))
		.join(" ");
	const date = new Date().toISOString().split("T")[0];
	return `---
	title: ${title} 
	preview: A new draft has been created.
	date: ${date} 
	---

	## Heading
	
	Post content.


	` // trim leading tabs
		.replace(/^\t+/gm, "");
}

async function edit(file) {
	await $`open -a Focused ${file}`;
}

function readInput(commands) {
	// blog -o some-slug
	// blog -l
	// etc.
	const shortcut = commands
		.filter((cmd) => cmd.shortcut)
		.find((cmd) => argv[cmd.shortcut]);

	if (shortcut) {
		console.log(shortcut);
		return {
			command: shortcut,
			arg: argv[shortcut.shortcut],
		};
	}

	// blog open some-slug
	// blog ls
	// etc.
	const name = commands.find((cmd) => argv._[0] === cmd.name);
	if (name) {
		return {
			command: name,
			arg: argv._[1],
		};
	}

	// Assume we're trying to open a blog post.
	// blog some-slug
	if (argv._.length === 1) {
		return {
			command: commands.find((cmd) => cmd.name === "open"),
			arg: argv._[0],
		};
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
		await fs.ensureDirectory(path.dirname(draft));
		await fs.writeFile(draft, template, { encoding: "utf8" });
	} catch (err) {
		console.log(err);
		return;
	}

	await edit(draft);
}

async function command_open(name, args) {
	console.log(name);

	const { content } = args;
	if (!name || typeof name !== "string") {
		if (true === await confirm(`Do you want to open the content directory?\n${chalk.dim(content)}`, 'y')) {
			await $`open ${content}`;
		}
		throw new Error("Well then please specify which blog post to open.");
	}

	if (name === ".") {
		return await $`open ${content}`;
	}
	const posts = await globby(`${content}/**/*.{md,mdx}`);
	const message = `\nFound multiple posts matching "${chalk.bold(
		name
	)}"\nWhich post you want to edit?`;
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
	const message = `\nFound multiple posts matching "${chalk.bold(
		needle
	)}"\nWhich post you want to publish?`;
	const files = await globby(`${drafts}/*.{md,mdx}`);
	const draft = await fuzzySelect(needle, files, message);

	// Update the post date to the date of publishing
	let postContent = await fs.readFile(draft, { encoding: "utf8" });
	const today = new Date().toISOString().split("T")[0];
	postContent = postContent.replace(/^date:.*$/gim, `date: ${today}`);

	const currentYear = new Date().getFullYear();
	const publishDirectory = `${content}/${currentYear}`;
	const publishPostPath = `${publishDirectory}/${path.basename(draft)}`;
	await fs.ensureDirectory(publishDirectory);
	await fs.writeFileSync(publishPostPath, postContent);
	await fs.remove(draft);
	console.log(`Published ${chalk.bold(path.basename(draft))}\n${chalk.dim(publishPostPath)}`);
}

async function command_run(_unused, { site }) {
	await $`cd ${site} && npm run dev`;
}

function sortByPath(a, b) {
	const aPath = a.split("/").slice(0, -1).join();
	const bPath = b.split("/").slice(0, -1).join();

	return aPath.localeCompare(bPath);
}

async function tree(name, pattern, ignorePattern = null) {
	let files = await globby(pattern);

	if (ignorePattern) {
		files = files.filter((file) => !file.includes(ignorePattern));
	}

	files.sort(sortByPath);
	let currentPath = "";

	console.log(`${chalk.bold(`## ${name}`)}`);
	for (const file of files) {
		const relativeFilePath = path.relative(process.cwd(), file);
		const pathBits = relativeFilePath.split("/");
		const filename = pathBits.pop();
		const iterationPath = pathBits.join("/");
		const indentations = pathBits.length;
		const indent = "   " + "  ".repeat(Math.max(indentations - 1, 0));

		if (iterationPath !== currentPath) {
			const iterationDir = pathBits.pop();
			console.log(`\n${indent}${chalk.bold(iterationDir)}/`);
			currentPath = iterationPath;
		}

		console.log(`${indent}• ${filename}`);
	}
}

async function command_list(_unused, { content, drafts }) {
	BUNS.verbose = false;
	console.log("")
	await tree("Drafts", `${drafts}/**/*.{md,mdx}`);
	console.log("")
	await tree("Published", `${content}/**/*.{md,mdx}`, drafts);
	console.log("")
}

// Edit the Astro site in VSCode
async function command_edit(name, { site }) {
	await $`open -a "Visual Studio Code" ${site}`;
}

async function command_rename(name, { content }) {
	const posts = await globby(`${content}/**/*.{md,mdx}`);
	const message = `\nFound multiple posts matching "${chalk.bold(
		name
	)}"\nWhich post you want to rename?`;
	const post = await fuzzySelect(name, posts, message);

	if (!argv._[2]) {
		throw new Error("Please specify the new name for the post.");
	}
	const postName = path.basename(post);
	const postSlug = postName.replace(/\.mdx?$/, "");
	const newName = postName.replace(postSlug, argv._[2]);
	const newPath = post.replace(postName, newName);

	if (! await confirm(`Rename ${chalk.bold(postName)} to ${chalk.bold(newName)}?`)) {
		return;
	}

	if (fs.pathExistsSync(newPath)) {
		throw new Error(`Can't rename to ${newName} because it already exists`);
	}

	await fs.rename(post, newPath);
}

// Command to get the site path
async function command_path(name, { site }) {
	console.log(site);
}

export async function AstroManager(name, site) {
	try {
		const commands = [
			{
				name: "run",
				shortcut: "r",
				action: command_run,
			},

			{
				name: "ls",
				shortcut: "l",
				action: command_list,
			},
			{
				name: "draft",
				shortcut: "d",
				action: command_draft,
			},
			{
				name: "publish",
				shortcut: "p",
				action: command_publish,
			},
			{
				name: "open",
				shortcut: "o",
				action: command_open,
			},
			{
				name: "edit",
				shortcut: "e",
				action: command_edit,
			},
			{
				name: "path",
				shortcut: "",
				action: command_path,
			},
			{
				name: "rename",
				shortcut: "",
				action: command_rename,
			},
			{
				name: "mv",
				shortcut: "",
				action: command_rename,
			}
		];

		const { command, arg } = readInput(commands);

		const content = `${site}/src/content`;
		const drafts = `${site}/src/content/drafts`;

		if (!command) {
			throw new Error("Which command should I run?");
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

Rename Post
	${name} mv <old_name> <new_name>
	${name} rename <old_name> <new_name>

Edit Site
	${name} edit
	${name} -e

Show Site Path
	${name} path
`
		);
	}
}
