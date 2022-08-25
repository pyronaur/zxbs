#!/usr/bin/env zx
$.verbose = false;
const token = process.env.PUSHOVER_TOKEN;
const user = process.env.PUSHOVER_USER;

if (!token || !user) {
	console.error('Missing Pushover token or user');
	process.exit(1);
}

const message = argv._.slice(1).join(' ');

if (!message) {
	console.error('Missing message');
	process.exit(1);
}

let title = "CLI";
if (argv.title) {
	title = argv.title;
}

console.log('Sending message: ', "message")

const result = await fetch(`https://api.pushover.net/1/messages.json`, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded'
	},
	body: `token=${token}&user=${user}&message=${message}&title=${title}`
});

if (result.status !== 200) {
	console.error('Failed to send the Pushover message');
	process.exit(1);
}

console.log(chalk.green('Notification sent'));