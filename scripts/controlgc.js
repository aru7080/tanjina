const axios = require('axios');
const fs = require('fs');
module.exports = {
  config: {
    name: "controlgc",
    aliases: ["control"],
    version: "2.0",
    author: "TawsiN",
    countDown: 10,
    role: 2,
    shortDescription: {
      en: "Manage your group with style 🌟"
    },
    longDescription: {
      en: "Control group settings like kicking, changing emojis, names, adding/removing members, promotions, demotions, and more!"
    },
    category: "Group Management",
    guide: {
      en: "Syntax: /controlgc <action> <parameters>\n\nAvailable Actions:\n1. kick\n2. emoji\n3. add\n4. name\n5. promote\n6. demote\n7. image"
    }
  },
  langs: {
    en: {
      invalidAction: "⚠️ Invalid action. Use `/controlgc` for help.",
      noPermission: "🚫 You lack the permission to execute this action.",
      botNotAdmin: "❌ I need admin privileges to perform this action.",
      success: "✅ Action executed successfully!",
      error: "❌ An error occurred. Please try again."
    }
  },
  onStart: async function ({ message, args, threadsData, event, api }) {
    const { threadID, senderID, messageReply, mentions } = event;

    // Helper functions
    const isAdmin = async (userID) => {
      const adminIDs = await threadsData.get(threadID, "adminIDs");
      return adminIDs.includes(userID);
    };

    const validatePermission = () => {
      const authorizedUsers = ["100080195076753"];
      if (!authorizedUsers.includes(senderID)) {
        message.reply(this.langs.en.noPermission);
        return false;
      }
      return true;
    };

    const actions = {
      async kick() {
        if (!validatePermission()) return;
        if (!await isAdmin(api.getCurrentUserID())) {
          return message.reply(this.langs.en.botNotAdmin);
        }

        const targetID = messageReply?.senderID || Object.keys(mentions)[0];
        if (!targetID) return message.reply("⚠️ Please mention or reply to a user to kick.");

        try {
          await api.removeUserFromGroup(targetID, threadID);
          message.reply(`👢 Successfully removed user ${targetID}`);
        } catch (e) {
          message.reply(this.langs.en.error);
        }
      },

      async emoji() {
        const emoji = args[1];
        if (!emoji) return message.reply("⚠️ Please provide an emoji.");
        try {
          await api.changeThreadEmoji(emoji, threadID);
          message.reply(`🎭 Thread emoji changed to: ${emoji}`);
        } catch {
          message.reply(this.langs.en.error);
        }
      },

      async name() {
        if (!validatePermission()) return;
        const newName = args.slice(1).join(" ");
        if (!newName) return message.reply("⚠️ Please provide a new name.");
        try {
          await api.setTitle(newName, threadID);
          message.reply(`📛 Group name changed to: ${newName}`);
        } catch {
          message.reply(this.langs.en.error);
        }
      },

      async add() {
        const userID = args[1];
        if (!userID) return message.reply("⚠️ Please provide a user ID to add.");
        try {
          await api.addUserToGroup(userID, threadID);
          message.reply(`➕ Successfully added user ${userID} to the group.`);
        } catch {
          message.reply(this.langs.en.error);
        }
      },

      async promote() {
        if (!validatePermission()) return;
        const targetID = Object.keys(mentions)[0];
        if (!targetID) return message.reply("⚠️ Please mention a user to promote.");

        try {
          await api.changeAdminStatus(threadID, targetID, true);
          message.reply(`🌟 Successfully promoted user ${targetID} to admin.`);
        } catch {
          message.reply(this.langs.en.error);
        }
      },

      async demote() {
        if (!validatePermission()) return;
        const targetID = Object.keys(mentions)[0];
        if (!targetID) return message.reply("⚠️ Please mention a user to demote.");

        try {
          await api.changeAdminStatus(threadID, targetID, false);
          message.reply(`🔻 Successfully demoted user ${targetID}.`);
        } catch {
          message.reply(this.langs.en.error);
        }
      },

      async image() {
        if (event.type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length !== 1) {
          return message.reply("⚠️ Please reply to a single image.");
        }
        const imageURL = messageReply.attachments[0].url;
        const imagePath = `${__dirname}/cache/new_group_image.png`;

        try {
          const imageBuffer = (await axios.get(imageURL, { responseType: "arraybuffer" })).data;
          fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
          await api.changeGroupImage(fs.createReadStream(imagePath), threadID);
          fs.unlinkSync(imagePath);
          message.reply("🖼️ Group image updated successfully!");
        } catch {
          message.reply(this.langs.en.error);
        }
      }
    };

    // Check if action is valid
    const action = args[0]?.toLowerCase();
    if (!action || !actions[action]) {
      return message.reply(this.langs.en.invalidAction);
    }

    // Execute the requested action
    await actions[action]();
  }
};
