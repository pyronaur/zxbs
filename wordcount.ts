
const text = await $`pbpaste`.text();

if (!flags.short) {
	console.log(ansis.gray("\n--------------------------------------------"))
	console.log(text);
	console.log(ansis.gray("--------------------------------------------"))
}
const wordCount = text.match(/[a-z][a-z']+/gi).length

// Word Count
console.log(ansis.bold("Word Count:	"), ansis.bold.green(`${wordCount} words`))

// Character Count
console.log(ansis.bold("Character Count:"), ansis.bold.green(`${text.length} characters`))
