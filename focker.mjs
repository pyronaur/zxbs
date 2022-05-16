#!/usr/bin/env zx
$.verbose = false;

async function confirm(q, defaultAnswer = "n") {
  if (argv.y) {
    return true;
  }
  let yes_no = `(y/N)`;
  if (defaultAnswer === "y") {
    yes_no = `(Y/n)`;
  }

  let answer = await question(`${q} ${yes_no} `);

  if (!answer) {
    answer = defaultAnswer;
  }

  return "y" === answer;
}

function log() {
  console.log(chalk.green("[Focker] "), ...arguments);
}

function split(result) {
  if (result.stdout === "") {
    return [];
  }
  return result.stdout.split("\n");
}

async function dockerInfo() {
  let containers = await $`docker ps -qa`;
  let images = await $`docker images -q`;
  let volumes = await $`docker volume ls -q`;
  let networks = await $`docker network ls -q`;

  return {
    containers: split(containers),
    images: split(images),
    volumes: split(volumes),
    networks: split(networks),
  };
}

async function logInfo() {
  const { containers, images, volumes, networks } = await dockerInfo();

  log(
    `Found ${containers.length} containers, ${images.length} images, ${volumes.length} volumes, ${networks.length} networks`
  );
}

await logInfo();

const { containers, images, volumes, networks } = await dockerInfo();

if (
  !(await confirm("Are you sure you want to nuke all your docker images?", "y"))
) {
  log("Aborting");
  process.exit(0);
}

if (containers.length > 0) {
  log("Stopping containers");
  await $`docker stop ${containers}`;

  log("Removing containers");
  await $`docker rm -f ${containers}`;
}

if (images.length > 0) {
  log("Removing all images");
  await $`docker rmi -f ${images}`;
}

if (volumes.length > 0) {
  log("Removing all volumes", volumes);
  await $`docker volume rm -f ${volumes}`;
}

if (networks.length > 0) {
  log("Removing all networks");
  await nothrow($`docker network rm ${networks}`);
}

// Maybe prune docker as well?
if (await confirm("Do you want to prune docker?", "y")) {
  await $`docker system prune -f`;
}

log("Done");

log("Checking for dangling bits:");
await logInfo();
