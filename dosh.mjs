#!/usr/bin/env zx
// await $`docker exec -it e6a938a3304f sh`
flags.verbose = false;

const containers = await $`ssh kaste "/usr/local/bin/docker ps -a --format '{{.ID}}\t{{.Names}}'"`;

if (containers.stderr) {
	throw new Error(containers.stderr);
}

if (!containers.stdout) {
	throw new Error(`No containers found on kaste`);
}

const containerList = containers.stdout
	.split("\n")
	.map((line) => {
		const [id, name] = line.split("\t");
		return { id, name };
	})
	.filter((v) => v.name);

export async function selection(options, selectionQuestion) {
	options.forEach((opt, index) => {
		console.log(`> ${chalk.bold(index + 1)}:  ${opt} `);
	});

	const selected =
		(await question(selectionQuestion + " (default: 1): \n")) || 1;

	return selected - 1;
}

const options = Array.from(containerList);
const names = options.map((v) => `${v.id} - ${v.name}`);

const selectedID = await select(
	names,
	`Which container do you want to ssh to on kaste?`
);
const containerId = options[selectedID].id;
const containerName = options[selectedID].name;

console.log(
	`Logging in to ${chalk.bold.white(containerName)} - ${containerId} on kaste`
);
await $`ssh -t kaste /usr/local/bin/docker exec -it ${containerId} sh`.pipe(process.stdout);
