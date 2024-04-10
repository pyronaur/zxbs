$.verbose = false;

function log() {
  console.log(chalk.green("[Focker] "), ...arguments);
}

function split(result) {
  if (result === "") {
    return [];
  }
  return result.split("\n");
}

async function dockerInfo() {
  let containers = await $`docker ps -qa`.text();
  let images = await $`docker images -q`.text();
  let volumes = await $`docker volume ls -q`.text();
  let networks = await $`docker network ls -q`.text()

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

if (!ack("Are you sure you want to nuke all your docker images?", "y")) {
  log("Aborting");
  process.exit(0);
}
console.log(networks, containers.length);
if (containers.length > 0) {
  log("Stopping containers");
  await $`docker stop ${containers}`.quiet();

  log("Removing containers");
  await $`docker rm -f ${containers}`.quiet();
}

if (images.length > 0) {
  log("Removing all images");
  await $`docker rmi -f ${images}`.quiet();
}

if (volumes.length > 0) {
  log("Removing all volumes", volumes);
  await $`docker volume rm -f ${volumes}`.quiet();
}

if (networks.length > 0) {
  log("Removing all networks");
  await $`docker network rm ${networks}`.quiet().nothrow();
}

// Maybe prune docker as well?
if (ack("Do you want to prune docker?", "y")) {
  await $`docker system prune -f`.quiet();
}

log("Done");

log("Checking for dangling bits:");
await logInfo();
