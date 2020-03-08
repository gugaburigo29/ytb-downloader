const movefile = require('move-file');
const fs = require('fs');
const ytdl = require('ytdl-core');
const Youtube = require('youtube-api');

const format = "wav";
const pathName = "tech";
const playlist = "https://www.youtube.com/playlist?list=PLsIZfCUJBAA2xV3QqOjv6GJ7SLPjh_kvv";

Youtube.authenticate({
    type: "key",
    key: "AIzaSyAyuly7-8zAqACEH0JMdhvAgdgJcp7n50I"
});

const playlistID = getPlaylistId(playlist);
getVideos(playlistID);

const asyncForeach = async (items, callback) => {
    for (const key in items) {
        console.log('>> Waiting promise: ', key)
        await callback(items[key], key, items);
        console.log('>> Promise resolved: ', key)
    }
}

const donwloadAsync = (url, fileName, index) => new Promise(resolve => {
    const tempFile = `temp${index}.${format}`;

    fileName.replace('/', "")

    ytdl(url)
        .pipe(fs.createWriteStream(tempFile))
        .on('finish', (e) => {
            movefile(tempFile, `./${pathName}/${fileName}`)
            resolve();
            console.log('>> File moved: ', fileName)
        })
});

function getVideos(playlistId, pageToken = undefined) {
    console.log(`> Getting videos for playlist ${playlistId}`)

    if (pageToken) {
        console.log(`> For next page token ${pageToken}`)
    }

    Youtube.playlistItems.list(
        {part: "snippet,id", playlistId, maxResults: 2, pageToken},
        async (err, data) => {
            if (err) {
                console.warn(`> ${err.message}`);
                return;
            }

            const {items} = data;

            console.log('>> Items loadded: ', items.length)

            await asyncForeach(
                items,
                (item, index) => donwloadAsync(`http://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
                    `${item.snippet.title}.${format}`,
                    index
                ))

            if (data.nextPageToken) {
                getVideos(playlistId, data.nextPageToken);
            }
        })
};

function getPlaylistId(url) {
    let id = url;
    const isUrl = url.includes('http');

    if (isUrl) {
        let replacePath = url.split("list=");
        id = replacePath[1];
    }

    if (!id) {
        throw new Error("> PlaylistId not provided.")
    }

    return id;
}
