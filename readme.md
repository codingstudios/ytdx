# [ytdx](https://github.com/codingstudios/ytdx)
An easy to use **Multi thread YouTube playlist audio (mp3) downloader** CLI tool

## Install
Requires `node.js@>=16` & [ffmpeg](https://www.ffmpeg.org)
```
npm install -g ytdx
```

## Usage
You will need a directory (folder) and a public YouTube playlist
```
ytdx --dir DIRECTORY_NAME --id PLAYLIST_ID
```

### Multiple Threads Support
ytdx supports multi thread downloading for extra performance therefore speedy downloads, the default is set to `1` thread.
```
ytdx --threads THREAD_COUNT --dir DIRECTORY_NAME --id PLAYLIST_ID
```

## License
This project is available as an open source under the terms of the [MIT License](https://github.com/codingstudios/ytdx/blob/main/LICENSE)


