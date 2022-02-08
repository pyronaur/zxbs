#!/usr/bin/env zx
// Download videos from Reddit

const url = await $`pbpaste`

cd(`${os.homedir()}/Social/Reddit`)


async function getVideoMeta(url) {
	const response = await fetch(url);
	const content = await response.text();

	const title = content.match(/<title.*?>(.*)<\/title>/)[1]
	const ID = content.match(/v\.redd\.it\/(\w+)/, 'gm')[1]

	return { ID, title }
}

function videoURL(videoID, quality = 480) {
	return `https://v.redd.it/${videoID}/DASH_${quality}.mp4`
}

async function downloadVideo(url, filename) {
	console.log("Downloading video")
	const response = await fetch(url)
	const buffer = await response.buffer();
	await fs.writeFile(filename, buffer)

	console.log(`Converting ${filename} to mov`)
	const movFilename = filename.replace('.mp4', '.mov');
	await $`ffmpeg -i ${filename}  -f mov ${movFilename}`

	await $`open -a Yoink ${movFilename}`
	await $`rm ${filename}`
}

const { ID, title } = await getVideoMeta(url);
const slug = title.slice(0, 16).replace(/[^\w]/gi, '-').toLowerCase();
const filename = slug + '.mp4'


// Fast & Filthy Code
try {
	await downloadVideo(videoURL(ID, 480), filename);
	process.exit(0);
} catch (err) {
	console.error("Failed to download 480p");
}

console.log("Trying 240p");
try {
	await downloadVideo(videoURL(ID, 240), filename);
} catch (err) {
	console.error("Failed");
}
