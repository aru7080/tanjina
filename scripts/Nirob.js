module.exports = {
  config: {
    name: "nirob",
    version: "1.0",
    author: "mahi",
    role: 0,
    shortDescription: "Responds to 'Nirob' with a message and a video",
    longDescription: "Sends a specific text and a single video when the keyword 'Nirob' is detected in the message.",
    category: "Fun", // Adjust category as needed
  },
  onStart: async function(){}, 
  onChat: async function({ event, message, getLang }) {
    try {
      console.log("Incoming message:", event.body);

      // Video URL
      const videoUrl = "https://i.imgur.com/2kBBQL4.mp4";

      // Check if the message contains the keyword "Nirob" (case insensitive)
      if (event.body && event.body.toLowerCase().includes("nirob")) {
        // Prepare attachment
        const videoAttachment = await global.utils.getStreamFromURL(videoUrl);

        // Reply with the text and the video
        await message.reply({
          body: "Nirob ekhon tar vibranium er Hoga diya showoff korse don't disturb",
          attachment: videoAttachment
        });

        console.log("Message sent successfully with the video.");
      }
    } catch (error) {
      console.error("Error in handling message:", error);
    }
  }
};
