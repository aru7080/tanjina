const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

function parseArgs(text) {
  const prompt = text.replace(/--[a-z]+\s*\S*/gi, "").trim();
  const arMatch = text.match(/--ar\s*([0-9.]+):([0-9.]+)/i);
  const aspectRatio = arMatch
    ? {
        width: parseFloat(arMatch[1]),
        height: parseFloat(arMatch[2])
      }
    : { width: 1, height: 1 };
  return { prompt, aspectRatio };
}

module.exports = {
  config: {
    name: "midjourney",
    aliases: [],
    version: "3.7",
    author: "@zayven x Renz",
    countDown: 10,
    role: 2,
    shortDescription: "Generate AI images using Midjourney API",
    longDescription: "Use Midjourney API to generate 4 images and select one with U1–U4",
    category: "ai",
    guide: `{pn} <prompt> [--ar W:H] [--v7] [--q2] [--cref] [--niji6]

✦ Supported aspect ratios:
• 1:1 (square)
• 4:3, 3:2, 2:3, 16:9, 9:16
• 5:4, 4:5, 21:9

✦ Examples:
{pn} fantasy warrior --ar 3:2
{pn} cyberpunk dog --ar 16:9 --v7
{pn} anime fox girl --ar 1:1 --niji6`
  },

  onStart: async function ({ api, event, args }) {
    const rawPrompt = args.join(" ");
    if (!rawPrompt)
      return api.sendMessage("⚠️ Please enter a prompt.\nExample: mj galaxy knight --ar 16:9", event.threadID, event.messageID);

    const { prompt, aspectRatio } = parseArgs(rawPrompt);
    const waitMsg = await api.sendMessage("✨ 𝙂𝙚𝙣𝙚𝙧𝙖𝙩𝙞𝙣𝙜 𝙮𝙤𝙪𝙧 𝙈𝙞𝙙𝙅𝙤𝙪𝙧𝙣𝙚𝙮 𝙢𝙖𝙜𝙞𝙘... ⏳", event.threadID, event.messageID);

    try {
      const res = await axios.get("https://www.zaikyoo-api.gleeze.com/api/mj-proxy-pub", {
        params: { prompt: rawPrompt }
      });

      const results = res.data?.results;
      if (!results || results.length !== 4)
        return api.sendMessage("❌ Failed to get 4 images. Please try again later.", event.threadID, waitMsg.messageID);

      const filePaths = [];
      for (let i = 0; i < results.length; i++) {
        const url = results[i];
        const filePath = path.join(__dirname, `cache/mj_${event.senderID}_${i}.jpg`);
        const response = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));
        filePaths.push(filePath);
      }

      const baseWidth = 2048;
      const baseHeight = Math.round(baseWidth * (aspectRatio.height / aspectRatio.width));
      const outputPath = path.join(__dirname, `cache/mj_combined_${event.senderID}.jpg`);

      await sharp({
        create: {
          width: baseWidth,
          height: baseHeight,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
        .composite([
          { input: filePaths[0], top: 0, left: 0 },
          { input: filePaths[1], top: 0, left: baseWidth / 2 },
          { input: filePaths[2], top: baseHeight / 2, left: 0 },
          { input: filePaths[3], top: baseHeight / 2, left: baseWidth / 2 }
        ])
        .toFile(outputPath);

      api.sendMessage({
        body: `✨ 𝐌𝐢𝐝𝐉𝐨𝐮𝐫𝐧𝐞𝐲 𝐂𝐨𝐦𝐩𝐥𝐞𝐭𝐞𝐝!\n\nSelect your image:\n🅄① – Top Left\n🅄② – Top Right\n🅄③ – Bottom Left\n🅄④ – Bottom Right`,
        attachment: fs.createReadStream(outputPath)
      }, event.threadID, async (err, info) => {
        if (err) console.error("Send error:", err);

        global.GoatBot.onReply.set(info.messageID, {
          commandName: "midjourney",
          author: event.senderID,
          images: results
        });

        setTimeout(() => {
          [...filePaths, outputPath].forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
        }, 60000);
      }, waitMsg.messageID);

    } catch (err) {
      console.error("Generation failed:", err?.response?.data || err);
      return api.sendMessage("❌ 𝙄𝙢𝙖𝙜𝙚 𝙜𝙚𝙣𝙚𝙧𝙖𝙩𝙞𝙤𝙣 𝙛𝙖𝙞𝙡𝙚𝙙. Please try again later.", event.threadID, waitMsg.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    if (event.senderID !== Reply.author) return;

    const input = event.body.trim().toUpperCase();
    const index = { U1: 0, U2: 1, U3: 2, U4: 3 }[input];

    if (index === undefined)
      return api.sendMessage("⚠️ Invalid option. Please reply with U1, U2, U3, or U4.", event.threadID, event.messageID);

    try {
      const url = Reply.images[index];
      const tempFile = path.join(__dirname, `cache/mj_select_${event.senderID}.jpg`);
      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(tempFile, Buffer.from(response.data, "binary"));

      api.sendMessage({
        body: `✅ 𝐘𝐨𝐮 𝐬𝐞𝐥𝐞𝐜𝐭𝐞𝐝 ${input}. 𝐇𝐞𝐫𝐞’𝐬 𝐲𝐨𝐮𝐫 𝐦𝐚𝐬𝐭𝐞𝐫𝐩𝐢𝐞𝐜𝐞!`,
        attachment: fs.createReadStream(tempFile)
      }, event.threadID, () => fs.existsSync(tempFile) && fs.unlinkSync(tempFile));

    } catch (err) {
      console.error("Image send error:", err);
      api.sendMessage("❌ 𝘾𝙤𝙪𝙡𝙙 𝙣𝙤𝙩 𝙨𝙚𝙣𝙙 𝙩𝙝𝙚 𝙞𝙢𝙖𝙜𝙚.", event.threadID, event.messageID);
    }
  }
};
