const axios = require('axios');

module.exports = {
  config: {
    name: "fl",
    aliases: ["arctic"], 
    version: "1.0",
    author: "ArchitectDevs",
    contributor: "Faith XE | Samir Œ |NS Sakib",
    countDown: 5,
    role: 0,
    shortDescription: "image generator",
    longDescription: "",
    category: "ai-generated",
    guide: {
      en: "{pn} <prompt>  "
    }
  },

  onStart: async function ({ message, args }) {
    let prompt = args.join(" ");
    
    try {
let a = '.run'
      const apiUrl = `https://www.samirxpikachu${a}.place/arcticfl?prompt=${encodeURIComponent(prompt)}`;
      
      const imageStream = await global.utils.getStreamFromURL(apiUrl);

      if (!imageStream) {
        return message.reply("Failed to retrieve image.");
      }
      
      return message.reply({
        body: '',
        attachment: imageStream
      });
    } catch (error) {
      console.error(error);
      return message.reply("Failed to retrieve image.");
    }
  }
};
