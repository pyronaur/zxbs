#!/usr/bin/env zx
/**
 * 
 * 
 * 
 * 
 * 
 * Helpers 
 * 
 * 
 * 
 * 
 *  
 */
async function confirm(q, defaultAnswer = "n") {
	let yes_no = `(y/N)`;
	if (defaultAnswer === "y") {
		yes_no = `(Y/n)`;
	}

	let answer = await question(`${q} ${yes_no} `);

	if (!answer) {
		answer = defaultAnswer;
	}

	return "y" === answer;
}

async function selection(options, selectionQuestion) {
	let result;
	options.forEach((opt, index) => {
		console.log(`> ${chalk.bold(index + 1)}:  ${opt} `)
	})

	const selected = await question(selectionQuestion + " (default: 1): \n") || 1;
	result = options[selected - 1];

	return result;
}

function fuzzyMatch(needle, str) {
	needle = '.*' + needle.split('').join('.*') + '.*';
	const re = new RegExp(needle);
	return re.test(str);
}

function fuzzyFilter(needle, arr) {
	return arr.filter(str => fuzzyMatch(needle, path.basename(str)))
}

async function fuzzySelect(needle, arr, message) {
	const results = fuzzyFilter(needle, arr);
	if (results.length === 0) {
		return;
	}

	if (results.length === 1) {
		return results[0];
	}

	return await selection(results, message);
}



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
	await $`open -a MacDown ${file}`
}

function readInput() {

	if (argv.d) {
		return {
			command: 'draft',
			arg: argv.d
		};
	}

	if (argv.p) {
		return {
			command: 'publish',
			arg: argv.p
		};
	}

	// If only one argument is provided, assume we want to open a blog post.
	if (argv._.length === 2) {
		return {
			command: 'open',
			arg: argv._[1]
		}
	}

	// Return the second argument
	const input = argv._[1];
	const arg = argv._[2];
	if (!input) {
		throw new Error('Which command should I run?')
	}

	return {
		command: input,
		arg
	};
}

async function command_draft(name, { drafts }) {
	const draft = `${drafts}/${name}.md`;
	if (fs.pathExistsSync(draft)) {
		await edit(draft);
		return;
	}

	try {
		const template = fileTemplate(name);
		await fs.writeFile(draft, template, { encoding: 'utf8' });
	} catch (err) {
		console.log(err);
		return;
	}

	await edit(draft);
}

async function command_open(name, args) {

	const { content } = args;
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

/**
 * 
 * 
 * 
 * 
 * 
 * Run
 * 
 * 
 * 
 * 
 * 
 */
try {
	const commands = {
		draft: command_draft,
		publish: command_publish,
		open: command_open,
	}
	const { command, arg } = readInput();
	const content = `${os.homedir()}/Projects/Sites/pyronaur.com/src/content`;
	const drafts = `${content}/drafts`;

	commands[command](arg, {
		content,
		drafts,
	});

} catch (err) {
	console.error(err.message);
	console.log(
		`
> Usage:
Create a new draft:
	blog <draft_name>
	blog draft <draft_name>
	blog -d <draft_name>

Edit any post or draft:
	blog open <name>
	blog <name>

Move draft to published directory:
	blog publish <draft_name>
	blog -p <draft_name>
`
	)
}


