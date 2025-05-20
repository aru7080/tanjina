module.exports = {
  config: {
    name: "othoi",
    version: "1.0",
    author: "mahi",
    role: 0,
    shortDescription: "Responds to 'othoi' with a message and a random GIF",
    longDescription: "Sends a specific text and a random GIF when the keyword 'othoi' is detected in the message.",
    category: "Fun", // Adjust category as needed
  },
  onStart: async function(){}, 
  onChat: async function({ event, message, getLang }) {
    try {
      console.log("Incoming message:", event.body);

      // List of GIF URLs
      const gifUrls = [
        "https://i.ibb.co/ZMbRQ5c/image.gif",
        "https://i.ibb.co/0Kw1JCz/image.gif",
        "https://i.ibb.co/qyF4Df3/image.gif"
      ];

      // Check if the message contains the keyword "othoi" (case insensitive)
      if (event.body && event.body.toLowerCase().includes("othoi")) {
        // Select a random GIF
        const randomGif = gifUrls[Math.floor(Math.random() * gifUrls.length)];

        // Prepare attachment
        const attachment = await global.utils.getStreamFromURL(randomGif);

        // Reply with the text and the selected GIF
        await message.reply({
          body: "ne othoi chocolate kha 🍫🍫- simple gift from Mahi",
          attachment: attachment
        });

        console.log("Message sent successfully with a random GIF.");
      }
    } catch (error) {
      console.error("Error in handling message:", error);
    }
  }
};
