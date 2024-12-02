/**
 * Open the repository in the browser.
 */
if (args[0]) {
	const zoxide = (await $`echo $(zoxide query ${args[0]})`.quiet().text()).trim();
	if (!zoxide) {
		console.error(`Couldn't find a match for "${args[0]}"`);
		process.exit(0);
	}

	const dir = SAF.from(zoxide);
	if (false === (await dir.isDirectory())) {
		console.error(`Couldn't find a match for "${args[0]}"`);
		process.exit(0);
	}

	const gitDir = SAF.from(dir.path, ".git");
	if (false === await gitDir.isDirectory()) {
		console.error(`Directory ${dir} does not contain a git repository`);
		process.exit(0);
	}
	cd(dir);
}
const repository = (await $`git remote get-url origin`.text()).trim();
await $`open ${repository}`;
export { };
