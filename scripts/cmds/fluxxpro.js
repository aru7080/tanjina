const axios = require('axios');
const { shortenURL, getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "fluxxpro",
    version: "1.1",
    author: "Mahi--",
    countDown: 0,
    longDescription: {
      en: "Create four images from your text using the FluxPro API with custom aspect ratio support."
    },
    category: "ai",
    role: 0,
    guide: {
      en: "Use this command with your prompt text and optional `--ar` parameter to generate images. Example: /fluxpro cat --ar 16:9"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const argString = args.join(' ').trim();
    const ratioMatch = argString.match(/--ar\s*([\d]+:[\d]+)/i); // Match "--ar X:Y"
    const aspectRatio = ratioMatch ? ratioMatch[1] : "1:1"; // Default to 1:1 if not provided
    const prompt = argString.replace(/--ar\s*([\d]+:[\d]+)/i, "").trim(); // Remove the --ar part from the prompt

    if (!prompt) return message.reply("Please provide a prompt, baka!");

    message.reply("Generating images... Please wait! 🖼", async (err, info) => {
      let ui = info.messageID;
      try {
        const apiUrl = `https://mahi-apis.onrender.com/api/fluxnew?prompt=${encodeURIComponent(prompt)}&ar=${encodeURIComponent(aspectRatio)}`;
        const response = await axios.get(apiUrl);
        const combinedImg = response.data.combinedImage;

        // Prevent the combined image from being unsent
        message.reply({
          body: "Reply with the image number (1, 2, 3, 4) to get the specific high-resolution image.",
          attachment: await getStreamFromURL(combinedImg, "combined_fluxpro.png")
        }, async (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            imageUrls: response.data.imageUrls
          });
        });
      } catch (error) {
        console.error(error);
        api.sendMessage(`⚠ Error: ${error.message}`, event.threadID);
      }
    });
  },

  onReply: async function ({ api, event, Reply, args, message }) {
    const reply = parseInt(args[0]);
    const { author, imageUrls } = Reply;

    if (event.senderID !== author) return;

    try {
      if (reply >= 1 && reply <= 4) {
        const img = imageUrls[`image${reply}`];
        const shortenedUrl = await shortenURL(img);

        const imageStream = await getStreamFromURL(img, `fluxpro_image${reply}.png`);

        message.reply({
          body: `Here is image ${reply}: ${shortenedUrl}`,
          attachment: imageStream
        });
      } else {
        message.reply("❌ Invalid number. Please reply with 1, 2, 3, or 4.");
      }
    } catch (error) {
      console.error(error);
      message.reply(`⚠ Error: ${error.message}`);
    }
  },
};
