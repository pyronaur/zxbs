#!/usr/bin/env zx
const modules = await $`find . -name 'node_modules' -type d -prune`;
for( const module of modules.toString().split('\n') ) {
	const module_path = module.trim().replace('./', '');
	if( module_path === '' ) continue;
	await $`rm -rf ${module_path}`;
}

