const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");

module.exports = {
  config: {
    name: "song",
    aliases: ["spotify"],
    version: "1.0",
    author: "@RI F AT ",
    countDown: 5,
    role: 0,
    shortDescription: "Download Spotify music",
    longDescription: "Download Spotify music by name",
    category: "music",
    guide: "{p}spotify <song name>"
  },

  onStart: async function ({ api, event, args }) {
    const name = args.join(" ");
    if (!name) return api.sendMessage("Enter a song name.", event.threadID, event.messageID);

    try {
      const res = await axios.get(`https://spotify-nine-pi.vercel.app/dl/?name=${encodeURIComponent(name)}`);
      const data = res.data;

      if (!data.download_url) return api.sendMessage("Couldn't fetch audio.", event.threadID, event.messageID);

      const filePath = path.join(__dirname, "cache", `${data.id}.mp3`);
      const file = fs.createWriteStream(filePath);

      https.get(data.download_url, function (response) {
        response.pipe(file);
        file.on("finish", () => {
          api.sendMessage({
            attachment: fs.createReadStream(filePath)
          }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
        });
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("Error while fetching the song.", event.threadID, event.messageID);
    }
  }
};
