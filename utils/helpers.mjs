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