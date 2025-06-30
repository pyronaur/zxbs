/**
 * CSS Variable Analyzer
 *
 * Recursively scans CSS/SCSS files to identify:
 * - Unused CSS variables
 * - Unused SCSS variables
 * - CSS variables that are used but missing definitions
 *
 * Usage:
 *   cssvars [--ext=css,scss]
 *
 * Options:
 *   --ext: Comma-separated list of file extensions to scan (default: css,scss)
 */

// Type definitions
type Variable = {
	name: string;
	type: 'css' | 'scss';
	definedIn: {
	  file: string;
	  line: number;
	  content: string;
	}[];
	usedIn: {
	  file: string;
	  line: number;
	  content: string;
	}[];
  };

  // Parse command line arguments
  const extensions = flags.ext ? flags.ext.split(',') : ['css', 'scss'];

  // Regular expressions for finding variables
  const cssVarDefRegex = /^\s*--([a-zA-Z0-9_-]+)\s*:/gm;
  const cssVarUseRegex = /var\(--([a-zA-Z0-9_-]+)(?:,\s*[^)]+)?\)/g;
  // Improved SCSS variable regex patterns
  const scssVarDefRegex = /\$([a-zA-Z0-9_-]+)\s*:/g;
  const scssVarUseRegex = /\$([a-zA-Z0-9_-]+)(?![:\s]*:)/g;

  // Store all variables
  const variables: Record<string, Variable> = {};

  // Find all files with the specified extensions recursively
  async function findFiles(extensions: string[]): Promise<string[]> {
    // Create an array of file patterns
    const patterns = extensions.map(ext => `**/*.${ext}`);

    // Use glob to find all matching files
    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern);
      files.push(...matches);
    }

    return files;
  }

  // Simple glob implementation
  async function glob(pattern: string): Promise<string[]> {
    try {
      // Use find with a simpler pattern that works reliably
      const ext = pattern.split('.').pop();
      const result = await $`find . -type f -name "*.${ext}"`.text();
      return result.trim().split('\n').filter(Boolean);
    } catch (error) {
      console.error(`Error finding files with pattern ${pattern}:`, error);
      return [];
    }
  }

  // Process a file to find variable definitions and usages
  async function processFile(filePath: string): Promise<void> {
    const content = await Bun.file(filePath).text();
    const lines = content.split('\n');

    // Process the entire file content for better multiline support
    // Process CSS variable definitions
    let match;

    // Process CSS variable definitions (line by line for accurate line numbers)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Reset regex state
      cssVarDefRegex.lastIndex = 0;
      while ((match = cssVarDefRegex.exec(line)) !== null) {
        const varName = match[1];
        const key = `css:${varName}`;

        if (!variables[key]) {
          variables[key] = {
            name: varName,
            type: 'css',
            definedIn: [],
            usedIn: []
          };
        }

        variables[key].definedIn.push({
          file: filePath,
          line: i + 1,
          content: line.trim()
        });
      }

      // Process CSS variable usages
      cssVarUseRegex.lastIndex = 0;
      while ((match = cssVarUseRegex.exec(line)) !== null) {
        const varName = match[1];
        const key = `css:${varName}`;

        if (!variables[key]) {
          variables[key] = {
            name: varName,
            type: 'css',
            definedIn: [],
            usedIn: []
          };
        }

        variables[key].usedIn.push({
          file: filePath,
          line: i + 1,
          content: line.trim()
        });
      }
    }

    // Process SCSS variables on the entire content for better detection
    // Process SCSS variable definitions
    scssVarDefRegex.lastIndex = 0;
    while ((match = scssVarDefRegex.exec(content)) !== null) {
      const varName = match[1];
      const key = `scss:${varName}`;

      if (!variables[key]) {
        variables[key] = {
          name: varName,
          type: 'scss',
          definedIn: [],
          usedIn: []
        };
      }

      // Find the line number
      const contentBeforeMatch = content.substring(0, match.index);
      const lineNumber = contentBeforeMatch.split('\n').length;
      const lineContent = lines[lineNumber - 1].trim();

      variables[key].definedIn.push({
        file: filePath,
        line: lineNumber,
        content: lineContent
      });
    }

    // Process SCSS variable usages
    scssVarUseRegex.lastIndex = 0;
    while ((match = scssVarUseRegex.exec(content)) !== null) {
      const varName = match[1];
      // Skip if this is actually a definition (might be caught by both regexes)
      if (content.substring(match.index, match.index + match[0].length + 1).includes(':')) {
        continue;
      }

      const key = `scss:${varName}`;

      if (!variables[key]) {
        variables[key] = {
          name: varName,
          type: 'scss',
          definedIn: [],
          usedIn: []
        };
      }

      // Find the line number
      const contentBeforeMatch = content.substring(0, match.index);
      const lineNumber = contentBeforeMatch.split('\n').length;
      const lineContent = lines[lineNumber - 1].trim();

      variables[key].usedIn.push({
        file: filePath,
        line: lineNumber,
        content: lineContent
      });
    }
  }

  // Main function
  async function main() {
	console.log(ansis.bold.blue(`\n📊 CSS/SCSS Variable Analysis 📊\n`));
	console.log(ansis.dim(`Scanning for file extensions: ${extensions.join(', ')}\n`));

	// Find all files
	const files = await findFiles(extensions);

	if (files.length === 0) {
	  console.log(ansis.yellow(`No files found with extensions: ${extensions.join(', ')}`));
	  return;
	}

	console.log(ansis.dim(`Found ${files.length} files to analyze...\n`));

	// Process each file
	for (const file of files) {
	  await processFile(file);
	}

	// Analyze results
	const unusedCssVars = Object.values(variables)
	  .filter(v => v.type === 'css' && v.definedIn.length > 0 && v.usedIn.length === 0);

	const unusedScssVars = Object.values(variables)
	  .filter(v => v.type === 'scss' && v.definedIn.length > 0 && v.usedIn.length === 0);

	const missingCssVars = Object.values(variables)
	  .filter(v => v.type === 'css' && v.definedIn.length === 0 && v.usedIn.length > 0);

	// Print results
	if (unusedCssVars.length > 0) {
	  console.log(ansis.bold.cyan(`\n🔍 Unused CSS Variables (${unusedCssVars.length}):`));
	  for (const variable of unusedCssVars) {
		console.log(ansis.cyan(`\n  --${variable.name}`));
		console.log(ansis.dim(`  Defined in:`));
		for (const def of variable.definedIn) {
		  console.log(ansis.dim(`    ${def.file}:${def.line}:`));
		  console.log(`    ${def.content}`);
		}
	  }
	}

	if (unusedScssVars.length > 0) {
	  console.log(ansis.bold.cyan(`\n🔍 Unused SCSS Variables (${unusedScssVars.length}):`));
	  for (const variable of unusedScssVars) {
		console.log(ansis.cyan(`\n  $${variable.name}`));
		console.log(ansis.dim(`  Defined in:`));
		for (const def of variable.definedIn) {
		  console.log(ansis.dim(`    ${def.file}:${def.line}:`));
		  console.log(`    ${def.content}`);
		}
	  }
	}

	if (missingCssVars.length > 0) {
	  console.log(ansis.bold.yellow(`\n⚠️ CSS Variables with Missing Definitions (${missingCssVars.length}):`));
	  for (const variable of missingCssVars) {
		console.log(ansis.yellow(`\n  --${variable.name}`));
		console.log(ansis.dim(`  Used in:`));
		for (const use of variable.usedIn) {
		  console.log(ansis.dim(`    ${use.file}:${use.line}:`));
		  console.log(`    ${use.content}`);
		}
	  }
	}

	// Print summary
	console.log(ansis.bold.blue(`\n📋 Summary:`));
	console.log(`  Total CSS variables: ${Object.values(variables).filter(v => v.type === 'css').length}`);
	console.log(`  Total SCSS variables: ${Object.values(variables).filter(v => v.type === 'scss').length}`);
	console.log(ansis.cyan(`  Unused CSS variables: ${unusedCssVars.length}`));
	console.log(ansis.cyan(`  Unused SCSS variables: ${unusedScssVars.length}`));
	console.log(ansis.yellow(`  CSS variables with missing definitions: ${missingCssVars.length}`));
	console.log();
  }

  // Run the main function
  await main();

  export {};
