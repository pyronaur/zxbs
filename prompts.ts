/**
 * AI Prompt Manager
 * @usage [[command] [name]] - Directly run a command on the specified prompt
 * @usage [[command]]  - Run the command without specifying the prompt name, will show a prompt selection menu
 * @usage [[name]]  - Copy the specified prompt to the clipboard or open the editor
 */
import { unlink } from 'fs/promises';
const dir = `${$HOME}/.prompts`;


async function create(name: string) {
	let content = '';
	if (ack("Paste prompt from clipboard?")) {
		content = await $`pbpaste`.text();
	}
	name = slugify(name);
	await Bun.write(`${dir}/${name}.md`, content);
	console.log(`Prompt ${ansis.bold(name)} created`);
	openEditor(`${dir}/${name}.md`);
}

async function remove(prompts: string[]) {
	if (prompts.length === 0) {
		console.log("No prompts found");
		return;
	}
	const name = await select("Select a prompt", prompts);
	const targetFile = `${dir}/${name}.md`;

	if (await Bun.file(targetFile).exists()) {
		await unlink(targetFile);
		console.log(`Prompt ${ansis.bold(name)} removed`);
	} else {
		console.log(`Prompt ${ansis.bold(name)} not found`);
	}
}

async function edit(names: string[]) {
	const name = await select("Select a prompt", names);
	const targetFile = `${dir}/${name}.md`;
	await openEditor(targetFile);
}

export default async function prompts() {
	await ensureDirectory(dir);
	let name = args[0]
	const prompts = await glob(`*.md`, { cwd: dir });
	const names = prompts.map(prompt => prompt.split('/').at(-1)?.split('.')[0]);
	if (name === "rm") {
		await remove(names);
		return;
	}
	if (name === "edit") {
		await edit(names);
		return;
	}
	if (!name) {
		if (prompts.length === 0) {
			console.log("No prompts found");
			return;
		}
		name = await select("Select a prompt", names);
	}
	const targetFile = `${dir}/${name}.md`;
	if (await Bun.file(targetFile).exists()) {
		const content = await Bun.file(targetFile).text();
		await $`echo "${content}" | pbcopy`;
		console.log(`\nPrompt ${ansis.bold(name)} copied to clipboard`);
		// Correctly invoking the wordcount command with the content
		const wordCountResult = await $`echo "${content}" | wordcount --short`.text();
		console.log(wordCountResult);
		return;
	}

	console.log(`Prompt ${ansis.bold(name)} not found`);
	if (ack("Create a new prompt?")) {
		await create(name);
	}
}
