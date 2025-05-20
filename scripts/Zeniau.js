module.exports = {
  config: {
    name: "zeni",
    version: "1.0",
    author: "mahi",
    role: 0,
    shortDescription: "Responds to 'Zeni' with a message and a random GIF",
    longDescription: "Sends a specific text and a random GIF when the keyword 'Zeni' is detected in the message.",
    category: "Fun", // Adjust category as needed
  },
  onStart: async function(){}, 
  onChat: async function({ event, message, getLang }) {
    try {
      console.log("Incoming message:", event.body);

      // List of GIF URLs
      const gifUrls = [
        "https://i.ibb.co/zGmqkFz/image.gif",
        "https://i.ibb.co/wz0r2c3/image.gif",
        "https://i.ibb.co/6Y7Vy0Q/image.gif"
      ];

      // Check if the message contains the keyword "zeni" (case insensitive)
      if (event.body && event.body.toLowerCase().includes("zeni")) {
        // Select a random GIF
        const randomGif = gifUrls[Math.floor(Math.random() * gifUrls.length)];

        // Prepare attachment
        const attachment = await global.utils.getStreamFromURL(randomGif);

        // Reply with the text and the selected GIF
        await message.reply({
          body: "𝚈𝚘𝚞 𝚏𝚘𝚘𝚕 𝚊𝚛𝚎 𝚢𝚘𝚞 𝚎𝚟𝚎𝚗 𝚠𝚘𝚛𝚝𝚑𝚢 𝚝𝚘 𝚝𝚢𝚙𝚎 𝚉𝚎𝚗𝚒 𝚋𝚛𝚘'𝚜 𝚗𝚊𝚖𝚎 ?",
          attachment: attachment
        });

        console.log("Message sent successfully with a random GIF.");
      }
    } catch (error) {
      console.error("Error in handling message:", error);
    }
  }
};
