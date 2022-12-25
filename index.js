#! /usr/bin/env node
import ffmpeg from 'fluent-ffmpeg';
import ytdl from 'ytdl-core';
import search from "youtube-sr";
import fs from 'fs';
import  pkg from './package.json' assert { type: "json" };
import { Collection } from '@discordjs/collection';
import minimist from 'minimist';
const collection = new Set();
const collection2 = new Collection();
const downloaded = [];
const all = [];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const argv = minimist(process.argv.slice(2));

const command = argv._[0];

function error(msg) {
    console.log(`
    Error: ${msg}
    Run [ytdx help] to learn more
    `)
    process.exit();
}

;(async () => {
switch(command) {
    case "h":
    case "help":
    console.log(`
    YouTube Playlist Downloader v${pkg.version}
    https://github.com/codingstudios/ytdx

    Usage: [ytdx --dir ./music --id PLPEUDPLQ7KSk_bp6kR]
    `)
    break;
    default:
    const playlistID = argv._[0] || argv?.id;
    const directory = argv._[1] || argv?.dir;
    if(typeof playlistID != "string") error("Please provide playlist ID");
    if(typeof directory != "string") error("Please provide a directory")
    if(!fs.existsSync(directory)) error(`${directory} does not exist`);
    await run(playlistID, directory);
}
})();

const getAudio = (video, dir) => new Promise((resolve, reject) => {
    var stream = ytdl(video?.url, { filter: 'audioonly' });
    var file = fs.createWriteStream(`./${dir}/${video?.title.split("/").join(" ").split(".").join(" ")}.mp3`);
    ffmpeg(stream)
    .format('mp3') 
    .save(file) 
    .on('end', () => {
        collection.add(`${video?.title}`); 
        resolve(`Done ${video?.title}`);
    })  
});        

async function run(playlistID, dirname) {
    const dir = fs.readdirSync(`./${dirname}`).filter(file => file.endsWith('.mp3'));
    dir.forEach(di => {
        collection.add(di.slice(0, -4));
        downloaded.push(di.slice(0, -4));
    })   
    await wait(5000);  
    const data = (await search.getPlaylist(`${playlistID}`).then(playlist => playlist.fetch()).catch(() => error("Invalid playlist ID provided")));
    if(!Array.isArray(data?.videos)) return error("No videos found"); 
    const videos = data.videos;  
    videos.forEach(async (video, i) => {
        all.push(video.title);   
        collection2.set(video.title, video.url);
       if(!collection.has(video?.title.split("/").join(" ").split(".").join(" "))) { 
         console.log(await getAudio(video, dirname));  
         downloaded.push(video?.title);
         console.log(downloaded.length, videos.length)
       }   
    })
};


  
process.on('uncaughtException', async function (err) {
   console.log(err)
});  
