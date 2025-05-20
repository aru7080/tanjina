const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "mj",
    version: "1.4",
    author: "API credit Renz",
    countDown: 120,
    longDescription: {
      en: "Generate 4 images using the specified API and allow selection.",
    },
    category: "ai",
    role: 2,
    guide: {
      en: "Use this command with your prompt to generate 4 AI images and select one or all.\nExample:  futuristic city",
    },
  },

  onStart: async function ({ api, event, args, message }) {
    if (!args.length) return message.reply("Please provide a prompt!");

    const prompt = encodeURIComponent(args.join(" "));
    const apiUrl = `https://renzsuperb.onrender.com/api/niji-v6?prompt=${prompt}&supporter_key=admin_renz_key`;

    message.reply("Generating  images... Please wait! 🖼", async () => {
      try {
        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

        if (!response || !response.data) {
          return message.reply("⚠ API did not return images. Try again later.");
        }

        const buffer = Buffer.from(response.data, "binary");
        const tempImagePath = path.join(__dirname, "temp_image.png");
        fs.writeFileSync(tempImagePath, buffer);

        // Load image and split into 4 parts
        const image = await loadImage(tempImagePath);
        const { width, height } = image;
        const subImageWidth = width / 2;
        const subImageHeight = height / 2;

        const subImages = [];
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 2; col++) {
            const canvas = createCanvas(subImageWidth, subImageHeight);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(
              image,
              col * subImageWidth,
              row * subImageHeight,
              subImageWidth,
              subImageHeight,
              0,
              0,
              subImageWidth,
              subImageHeight
            );
            const subImagePath = path.join(__dirname, `sub_image_${row * 2 + col + 1}.png`);
            const out = fs.createWriteStream(subImagePath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);
            await new Promise((resolve) => out.on("finish", resolve));
            subImages.push(subImagePath);
          }
        }

        // Send all 4 images in a single message
        message.reply(
          {
            body: "Here are your images! Reply with a number (1-4) to select an image or 'all' to receive all images.",
            attachment: subImages.map((imgPath) => fs.createReadStream(imgPath)),
          },
          async (err, info) => {
            if (err) return console.error("Error sending images:", err);

            // Listen for user response
            api.listenMqtt(async (error, replyEvent) => {
              if (error) return console.error("Listener Error:", error);

              if (
                replyEvent.type === "message_reply" &&
                replyEvent.messageReply.messageID === info.messageID
              ) {
                const selected = replyEvent.body.trim().toLowerCase();

                if (selected === "all") {
                  await message.reply({
                    body: "You selected all images:",
                    attachment: subImages.map((imgPath) => fs.createReadStream(imgPath)),
                  });
                } else {
                  const selectedNumber = parseInt(selected, 10);
                  if (selectedNumber >= 1 && selectedNumber <= 4) {
                    await message.reply({
                      body: `You selected Image ${selectedNumber}:`,
                      attachment: fs.createReadStream(subImages[selectedNumber - 1]),
                    });
                  } else {
                    return message.reply("Invalid selection. Reply with a number 1-4 or 'all'.");
                  }
                }

                // Cleanup images after sending
                subImages.forEach((imgPath) => fs.unlinkSync(imgPath));
                fs.unlinkSync(tempImagePath);
              }
            });
          }
        );
      } catch (error) {
        console.error("API Request Error:", error.message);
        message.reply("⚠ Error fetching images. API might be down.");
      }
    });
  },
};
