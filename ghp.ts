if( args.length === 0 ) {
    await $`ghr --pr`;
    die(0);
}

await $`ghr ${args[0]} --pr`;
