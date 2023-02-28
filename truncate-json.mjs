#!/usr/bin/env zx
const file = argv._[0];
const json = await fs.readJSON(file);

function truncate(value) {
	if (typeof value === 'string') {
		return value.slice(0, 500);
	}
	if (Array.isArray(value)) {
		return value.map(truncate);
	}
	if (typeof value === 'object' && value !== null && value !== undefined) {
		return Object.fromEntries(
			Object.entries(value).map(([key, value]) => [key, truncate(value)])
		);
	}
	return value;
}

await fs.writeJSON(`${file}-truncated `, truncate(json), {spaces: 2});