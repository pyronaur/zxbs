/**
 * Open the repository in the browser.
 */
const repository = await $`git remote get-url origin`.text();
await $`open ${repository.trim()}`;