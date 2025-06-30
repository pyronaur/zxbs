#!/usr/bin/env bun

/**
 * Doccopy - Automatic clipboard to markdown file converter
 *
 * Monitors the system clipboard and automatically creates markdown files
 * from copied text with intelligent filename generation.
 */

import { sleep } from 'bun';

let lastClipboardContent = '';
let isRunning = true;

/**
 * Get current clipboard content using macOS pbpaste
 */
async function getClipboardContent(): Promise<string> {
	try {
		const result = await $`pbpaste`.text();
		return result;
	} catch (error) {
		console.error('Error reading clipboard:', error);
		return '';
	}
}

/**
 * Convert text to kebab-case filename
 */
function toKebabCase(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
		.replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate filename from text content
 */
function generateFilename(content: string): string {
	const lines = content.split('\n').slice(0, 10); // First 10 lines

	// Filter lines with 5 or fewer words
	const filteredLines = lines.filter(line => {
		const words = line.trim().split(/\s+/).filter(word => word.length > 0);
		return words.length <= 5 && line.trim().length > 0;
	});

	if (filteredLines.length === 0) {
		// Fallback: use first non-empty line, truncated
		const firstLine = lines.find(line => line.trim().length > 0);
		if (firstLine) {
			const words = firstLine.trim().split(/\s+/).slice(0, 5);
			return toKebabCase(words.join(' '));
		}
		return 'clipboard-content';
	}

	// Use the first suitable line
	const selectedLine = filteredLines[0];
	return toKebabCase(selectedLine.trim());
}

/**
 * Get unique filename by checking for conflicts
 */
async function getUniqueFilename(baseFilename: string): Promise<string> {
	let filename = `${baseFilename}.md`;
	let counter = 1;

	// Check if file exists in current directory
	while (await Bun.file(filename).exists()) {
		filename = `${baseFilename}-${counter}.md`;
		counter++;
	}

	return filename;
}

/**
 * Create markdown file with clipboard content
 */
async function createMarkdownFile(content: string): Promise<void> {
	const baseFilename = generateFilename(content);
	const filename = await getUniqueFilename(baseFilename);

	try {
		const saf = SAF.from(filename);
		await saf.write(content);

		console.log(ansis.green(`✓ Created: ${filename}`));
		console.log(ansis.dim(`  Content: ${content.length} characters`));
	} catch (error) {
		console.error(ansis.red(`✗ Error creating file ${filename}:`), error);
	}
}

/**
 * Main monitoring loop
 */
async function monitorClipboard(): Promise<void> {
	console.log(ansis.blue('🔍 Doccopy started - monitoring clipboard...'));
	console.log(ansis.dim('Press Ctrl+C to stop'));

	while (isRunning) {
		try {
			const currentContent = await getClipboardContent();

			// Check if clipboard content has changed and is not empty
			if (currentContent && currentContent !== lastClipboardContent) {
				// Only process text content (ignore very short content that might be accidental)
				if (currentContent.trim().length > 10) {
					console.log(ansis.yellow('📋 New clipboard content detected'));
					await createMarkdownFile(currentContent);
					lastClipboardContent = currentContent;
				}
			}

			// Wait before next check (1 second)
			await sleep(1000);
		} catch (error) {
			console.error(ansis.red('Error in monitoring loop:'), error);
			await sleep(2000); // Wait longer on error
		}
	}
}

/**
 * Handle graceful shutdown
 */
function setupSignalHandlers(): void {
	process.on('SIGINT', () => {
		console.log(ansis.yellow('\n🛑 Stopping doccopy...'));
		isRunning = false;
		process.exit(0);
	});

	process.on('SIGTERM', () => {
		console.log(ansis.yellow('\n🛑 Stopping doccopy...'));
		isRunning = false;
		process.exit(0);
	});
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
	setupSignalHandlers();

	// Initialize with current clipboard content to avoid immediate trigger
	lastClipboardContent = await getClipboardContent();

	await monitorClipboard();
}

// Start the script
main().catch(error => {
	console.error(ansis.red('Fatal error:'), error);
	process.exit(1);
});

export {};