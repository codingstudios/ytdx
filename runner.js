import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
ffmpeg.setFfmpegPath(ffmpegPath.path);
import { workerData, parentPort } from "worker_threads";

const getAudio = (video) =>
  new Promise((resolve, reject) => {
    var stream = ytdl(video?.url, { filter: "audioonly" });
    var file = fs.createWriteStream(
      `./${workerData?.dirname}/${video?.title
        .split("/")
        .join(" ")
        .split(".")
        .join(" ")}.mp3`
    );
    ffmpeg(stream)
      .format("mp3")
      .save(file)
      .on("end", () => {
        resolve({
          status: "done",
          name: video?.title,
          filename: video?.title.split("/").join(" ").split(".").join(" "),
        });
      });
  });

(async () => {
  const job = workerData.jobs[workerData.thread_count];
  for (let video of job) {
    try {
      parentPort.postMessage(
        await getAudio({
          ...video,
          url: "https://www.youtube.com/watch?v=" + video?.id,
        })
      );
    } catch (e) {
      parentPort.postMessage({
        status: "error",
        name: video?.title,
        message: e.message,
      });
    }
  }

  parentPort.postMessage("end");
})();
