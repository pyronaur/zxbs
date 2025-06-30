/**
 * Displays git statistics for changes made today with pretty formatting
 * @returns Statistics about today's git activity
 */
export async function getTodayStats(): Promise<{
	files: number;
	inserted: number;
	deleted: number;
	commits: number;
	hoursSinceMidnight: number;
}> {
	// Get basic stats (files, insertions, deletions)
	const basicStats = await $`git log --shortstat --since="midnight" --until="now" \
    | grep -E "file[s]* changed" \
    | sed -E 's/changed, ([0-9]+) deletions/changed, 0 insertions(+), \\1 deletions/g' \
    | awk '{files+=$1; inserted+=$4; deleted+=$6} END {print files, inserted, deleted}'`.text();

	const [files, inserted, deleted] = basicStats.trim().split(" ").map(Number);

	// Get commit count
	const commitCount = await $`git log --since="midnight" --until="now" --pretty=format:"%H" | wc -l`.text();

	// Calculate hours since midnight
	const now = new Date();
	const midnight = new Date(now);
	midnight.setHours(0, 0, 0, 0);
	const hoursSinceMidnight = (now.getTime() - midnight.getTime()) / (1000 * 60 * 60);

	return {
		files: files || 0,
		inserted: inserted || 0,
		deleted: deleted || 0,
		commits: parseInt(commitCount.trim()) || 0,
		hoursSinceMidnight,
	};
}

export default async function main() {
	try {
		const stats = await getTodayStats();

		// Create a header
		console.log(ansis.bold.cyan("\n📊 TODAY'S GIT ACTIVITY 📊\n"));

		// Display stats in a table-like format
		console.log(ansis.bold("┌─────────────────┬────────────┐"));
		console.log(`${ansis.bold("│")} ${ansis.bold.green("Files Changed")}   ${ansis.bold("│")} ${ansis.yellow(stats.files.toString().padStart(10))} ${ansis.bold("│")}`);
		console.log(ansis.bold("├─────────────────┼────────────┤"));
		console.log(`${ansis.bold("│")} ${ansis.bold.green("Lines Inserted")}  ${ansis.bold("│")} ${ansis.green("+" + stats.inserted.toString().padStart(9))} ${ansis.bold("│")}`);
		console.log(ansis.bold("├─────────────────┼────────────┤"));
		console.log(`${ansis.bold("│")} ${ansis.bold.green("Lines Deleted")}   ${ansis.bold("│")} ${ansis.red("-" + stats.deleted.toString().padStart(9))} ${ansis.bold("│")}`);
		console.log(ansis.bold("├─────────────────┼────────────┤"));
		console.log(`${ansis.bold("│")} ${ansis.bold.green("Total Commits")}   ${ansis.bold("│")} ${ansis.cyan(stats.commits.toString().padStart(10))} ${ansis.bold("│")}`);
		console.log(ansis.bold("└─────────────────┴────────────┘"));

		// Display net change
		const netChange = stats.inserted - stats.deleted;
		const netChangeColor = netChange > 0 ? ansis.green : netChange < 0 ? ansis.red : ansis.white;
		console.log(`\n${ansis.bold("Net Change:")} ${netChangeColor(netChange > 0 ? "+" + netChange : netChange)}`);

		// Display productivity metrics if there are changes
		if (stats.files > 0) {
			console.log(`  ${ansis.dim("•")} ${ansis.dim(`Avg. lines per file: ${((stats.inserted + stats.deleted) / stats.files).toFixed(1)}`)}`)
			console.log(`  ${ansis.dim("•")} ${ansis.dim(`Avg. commits per file: ${(stats.commits / stats.files).toFixed(1)}`)}`)

			// Calculate and display average lines per hour
			const totalLines = stats.inserted + stats.deleted;
			const avgLinesPerHour = stats.hoursSinceMidnight > 0
				? (totalLines / stats.hoursSinceMidnight).toFixed(1)
				: totalLines.toFixed(1);
			console.log(`  ${ansis.dim("•")} ${ansis.dim(`Avg. lines per hour: ${avgLinesPerHour}`)}`)
		}

	} catch (error) {
		console.error(ansis.red.bold("\n❌ Error:"), ansis.red(error instanceof Error ? error.message : String(error)));
		console.error(ansis.yellow("Make sure you're in a git repository."));
		process.exit(1);
	}
}
