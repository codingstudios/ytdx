#! /usr/bin/env node
import { Worker } from "worker_threads";
import search from "youtube-sr";
import fs from "fs";
import pkg from "./package.json" assert { type: "json" };
import minimist from "minimist";
const collection = new Set();
const downloaded = [];
const videos = [];

const argv = minimist(process.argv.slice(2));

const command = argv._[0];

function error(msg) {
  console.log(`
    Error: ${msg}
    Run [ytdx help] to learn more
    `);
  process.exit();
}

(async () => {
  switch (command) {
    case "h":
    case "help":
      console.log(`
    YouTube Playlist Downloader v${pkg.version}
    https://github.com/codingstudios/ytdx

    Usage: [ytdx --dir ./music --id PLPEUDPLQ7KSk_bp6kR]
    `);
      break;
    default:
      const playlistID = argv._[0] || argv?.id || argv?.i;
      const directory = argv._[1] || argv?.dir || argv?.d;
      const thread_count = argv?.threads || argv?.t || 1;
      if (typeof playlistID != "string") error("Please provide playlist ID");
      if (typeof directory != "string") error("Please provide a directory");
      if (!fs.existsSync(directory)) error(`${directory} does not exist`);
      await run(playlistID, directory, thread_count);
  }
})();

const getTime = (d) => {
  d = new Date(1000 * Math.round(d / 1000));
  function pad(i) {
    return ("0" + i).slice(-2);
  }
  return (
    d.getUTCHours() +
    ":" +
    pad(d.getUTCMinutes()) +
    ":" +
    pad(d.getUTCSeconds())
  );
};

async function run(playlistID, dirname, thread_count) {
  const timeStart = performance.now();
  const dir = fs
    .readdirSync(`./${dirname}`)
    .filter((file) => file.endsWith(".mp3"));
  for (const i in dir) {
    collection.add(dir[i].slice(0, -4));
  }
  const data = await search
    .getPlaylist(`${playlistID}`)
    .then((playlist) => playlist.fetch())
    .catch(() => error("Invalid playlist ID provided"));
  if (!Array.isArray(data?.videos)) return error("No videos found");
  const jobs = [];
  for (let i in data.videos) {
    if (
      !collection.has(
        data.videos[i]?.title.split("/").join(" ").split(".").join(" ")
      )
    ) {
      videos.push(data.videos[i]);
    }
  }
  if (videos.length == 0)
    return console.log(`
    All tracks are downloaded
    `);
  for (let i = 0; i < videos.length; i += videos.length / thread_count) {
    jobs.push(videos.slice(i, i + videos.length / thread_count));
  }
  async function createWorker(i) {
    return new Promise(function (resolve, reject) {
      const worker = new Worker("./runner.js", {
        workerData: { thread_count: i, jobs, dirname },
      });
      worker.on("message", (data) => {
        if (data.status == "done") {
          downloaded.push(data.name);
          collection.add(data.filename);
          console.log(
            " Done ",
            `(${downloaded.length}/${collection.size}/${videos.length})`,
            `[${getTime(performance.now() - timeStart)}]`,
            data.name,
          );
        }
        if (data.status == "error") error(data.message);
        if (data == "end") {
          worker.terminate();
          resolve(data);
        }
      });
      worker.on("error", (msg) => {
        reject(`An error ocurred: ${msg}`);
      });
    });
  }
  console.log(`
    [YTDX] Job Started with ${thread_count} threads [output to ${dirname}]
`);
  const workerPromises = [];
  for (let i = 0; i < thread_count; i++) {
    workerPromises.push(createWorker(i));
  }

  await Promise.all(workerPromises);

  console.log(
    `[YTDX] Job Done in [${getTime(
      performance.now() - timeStart
    )}] Downloaded (${downloaded.length}/${videos.length})`
  );
}

process.on("uncaughtException", async function (err) {
  console.log(err);
});
