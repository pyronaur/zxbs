#!/usr/bin/env zx
const util = require("util");

const files = argv._.slice(0, 2);

if (files.length !== 2) {
  console.log("To find your yamlicates, you need to pass two files.");
  console.log(`Usage: yamlicates <file1.yaml> <file2.yaml>`);
}

const yamls = files.map((file) => YAML.parse(fs.readFileSync(file, "utf8")));

function diff(a, b) {
  const commons = {};
  for (const aKey in a) {
    const aVal = a[aKey];
    const bVal = b[aKey];

    if (aVal === bVal) {
      commons[aKey] = aVal;
    }

    if (!b[aKey]) {
      if (commons[aKey]) {
        delete commons[aKey];
      }
      continue;
    }

    if (typeof aVal === "object" && typeof bVal === "object") {
      commons[aKey] = diff(aVal, bVal);
    }

    if (!commons[aKey] || Object.values(commons[aKey]).length === 0) {
      delete commons[aKey];
    }
  }

  return commons;
}

console.log(
  util.inspect(diff(yamls[0], yamls[1]), {
    showHidden: false,
    depth: null,
    colors: true,
  })
);
