/**
 * Docker CLI Utilities (tail, restart)
 * @param [[tail]] - Tail the logs of a docker container
 * @param [[restart]] - Restart a docker container
 */

async function selectDockerImage() {
	const containers = await $`ssh kaste "/usr/local/bin/docker ps --format '{{json .}}'"`.text();
	const containerMap: { value: string; label: string }[] = [];
	containers
		.split("\n")
		.map((c: string) => c.trim())
		.filter(Boolean)
		.map((c: string) => JSON.parse(c))
		.forEach((c: any) => {
			containerMap.push({
				label: `${c.Names} (${c.Image})`,
				value: c.ID,
			});
		});

	return await select(`Select a container on kaste`, containerMap);
}
async function tailDockerLogs() {
	const image = await selectDockerImage();
	await $`ssh kaste /usr/local/bin/docker logs -f ${image}`;
}

async function restartDockerContainer() {
	const image = await selectDockerImage();
	console.log(`Restarting container ${image} on kaste`);
	await $`ssh kaste /usr/local/bin/docker restart ${image}`;
}

export default async function dock() {
	const availableCommands = {
		tail: tailDockerLogs,
		restart: restartDockerContainer,
		rr: restartDockerContainer,
	} as const;

	const command = args[0] as keyof typeof availableCommands;
	if (command && command in availableCommands) {
		await availableCommands[command]();
	} else {
		console.log(`Invalid Command: ${command}`);
		console.log(
			`Available Commands: ${Object.keys(availableCommands).join(", ")}`
		);
	}
}
