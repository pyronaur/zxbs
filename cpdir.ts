/**
 * Copy the current directory to the clipboard
 */
const dir = await cwd();
await $`echo "${dir}" | tr -d '\n' | pbcopy`
console.log(`Copied: ${ansis.bold(dir)}`)