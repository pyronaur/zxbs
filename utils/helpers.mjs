export async function confirm(q, defaultAnswer = "n") {
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

export async function selection(options, selectionQuestion) {
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

export async function fuzzySelect(needle, arr, message) {
	const results = fuzzyFilter(needle, arr);
	if (results.length === 0) {
		return;
	}

	if (results.length === 1) {
		return results[0];
	}

	return await select(results, message);
}