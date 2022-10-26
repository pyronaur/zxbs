#!/usr/bin/env zx

const contents = fs.readFileSync(`${os.homedir()}/.ssh/config`, 'utf8')
const hosts = contents
	.split("\n")
	.filter((line) => line.trim().startsWith("Host "))
	.map((line) => line.trim().split(/\s+/)[1]);

console.log(hosts.join("\n"))