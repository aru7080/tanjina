const fs = require("fs-extra");
const axios = require("axios");
const request = require("request");

module.exports = {
  config: {
    name: 'auto',
    version: '5.4',
    author: 'ariyan',
    countDown: 5,
    role: 0,
    shortDescription: 'Auto download videos from FB, YT, IG, TikTok',
    category: 'media',
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("✅ AutoDownloader active for FB, YouTube, TikTok & Instagram links.", event.threadID);
  },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const urlMatch = body.match(/(https?:\/\/[^\s]+)/);
    if (!urlMatch) return;

    const url = urlMatch[0];
    const supportedDomains = ["facebook.com", "fb.watch", "youtube.com", "youtu.be", "instagram.com", "tiktok.com"];
    const platform = supportedDomains.find(domain => url.includes(domain));
    if (!platform) return;

    const platformNames = {
      "facebook.com": "𝙁𝙖𝙘𝙚𝙗𝙤𝙤𝙠",
      "fb.watch": "𝙁𝙖𝙘𝙚𝙗𝙤𝙤𝙠",
      "youtube.com": "𝙔𝙤𝙪𝙏𝙪𝙗𝙚",
      "youtu.be": "𝙔𝙤𝙪𝙏𝙪𝙗𝙚",
      "instagram.com": "𝙄𝙣𝙨𝙩𝙖𝙜𝙧𝙖𝙢",
      "tiktok.com": "𝙏𝙞𝙠𝙏𝙤𝙠"
    };
    const platformName = platformNames[platform] || "𝙑𝙞𝙙𝙚𝙤";

    const processingMsg = await api.sendMessage("⏳ 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙𝙞𝙣𝙜 𝙮𝙤𝙪𝙧 𝙫𝙞𝙙𝙚𝙤, 𝙝𝙤𝙡𝙙 𝙩𝙞𝙜𝙝𝙩...", threadID, messageID);

    try {
      const res = await axios.get(`https://nayan-video-downloader.vercel.app/alldown?url=${encodeURIComponent(url)}`);
      const data = res.data.data || {};
      const { title, high, low } = data;
      const videoURL = high || low;

      if (!videoURL) {
        await api.unsendMessage(processingMsg.messageID);
        return api.sendMessage("❌ 𝙎𝙤𝙧𝙧𝙮, 𝙘𝙤𝙪𝙡𝙙𝙣’𝙩 𝙛𝙞𝙣𝙙 𝙖 𝙙𝙤𝙬𝙣𝙡𝙤𝙖𝙙𝙖𝙗𝙡𝙚 𝙫𝙞𝙙𝙚𝙤 𝙖𝙩 𝙩𝙝𝙖𝙩 𝙡𝙞𝙣𝙠.", threadID, messageID);
      }

      const imgurRes = await axios.get(`https://imgur-upload-psi.vercel.app/mahabub?url=${encodeURIComponent(videoURL)}`);
      const imgurLink = imgurRes.data.url || "𝙐𝙣𝙖𝙫𝙖𝙞𝙡𝙖𝙗𝙡𝙚";

      await api.unsendMessage(processingMsg.messageID);

      const messageBody = 
`🎬 𝙃𝙚𝙧𝙚 𝙞𝙨 𝙮𝙤𝙪𝙧 ${platformName} 𝙫𝙞𝙙𝙚𝙤!

📌 𝙏𝙞𝙩𝙡𝙚: ${title || "𝙐𝙣𝙠𝙣𝙤𝙬𝙣"}
🌐 𝙄𝙢𝙜𝙪𝙧 𝙇𝙞𝙣𝙠: ${imgurLink}`;

      const filePath = "video.mp4";
      request(videoURL)
        .pipe(fs.createWriteStream(filePath))
        .on("close", () => {
          api.sendMessage({
            body: messageBody,
            attachment: fs.createReadStream(filePath)
          }, threadID, () => fs.unlinkSync(filePath));
        });

    } catch (error) {
      await api.unsendMessage(processingMsg.messageID);
      console.error("AutoDL Error:", error.message || error);
      api.sendMessage("❌ 𝙊𝙤𝙥𝙨! 𝙁𝙖𝙞𝙡𝙚𝙙 𝙩𝙤 𝙙𝙤𝙬𝙣𝙡𝙤𝙖𝙙 𝙩𝙝𝙚 𝙫𝙞𝙙𝙚𝙤.", threadID, messageID);
    }
  }
};
