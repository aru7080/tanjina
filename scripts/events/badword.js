const badwords = [
  "fuck", "shit", "bitch", "asshole", "bastard", "f*ck", "fuk", "mf", "suck", "dick",
  "gandu", "chod", "choda", "boka", "pagol", "kamla", "randi", "bokachoda", "magi", "maa ke", "tor bou", "tor ma",
  "চোদ", "চোদা", "মাদারচোদ", "বাজে", "মাগী", "রানডি", "বোকাচোদা", "তোর মা", "তোর বোন", "গালি"
];

module.exports = {
  config: {
    name: "badword",
    version: "2.2",
    author: "GPTBot",
    description: "Auto warn and ban users who use bad words, with on/off toggle",
    category: "events",
    usePrefix: true,
    role: 1,
    guide: {
      en: "{pn} on | off"
    }
  },

  onStart: async function ({ message, args, threadsData, event }) {
    if (!args[0]) return message.reply("Please use: badword on/off");
    const isOn = args[0].toLowerCase() === "on";
    await threadsData.set(event.threadID, { badwordEnabled: isOn });
    return message.reply(`Badword filter has been turned ${isOn ? "ON" : "OFF"} for this group.`);
  },

  onEvent: async function({ event, usersData, threadsData, api }) {
    const { body, senderID, threadID } = event;
    if (!body || event.isGroup === false) return;

    const threadData = await threadsData.get(threadID);
    if (!threadData?.badwordEnabled) return;

    const message = body.toLowerCase();
    const matched = badwords.find(word => message.includes(word));
    if (!matched) return;

    const userData = await usersData.get(senderID);
    const userName = userData?.name || "User";
    let warns = userData?.warns || 0;
    warns++;

    if (warns >= 3) {
      try {
        await api.removeUserFromGroup(senderID, threadID);
        await usersData.set(senderID, { warns: 0 });
        return api.sendMessage(`⛔ ${userName} has been removed for using offensive language 3 times.`, threadID);
      } catch (e) {
        return api.sendMessage(`⚠️ Failed to remove ${userName}. Make sure bot is admin.`, threadID);
      }
    } else {
      await usersData.set(senderID, { warns });
      return api.sendMessage(
        `⚠️ Warning ${userName}!\nBad word: "${matched}"\nWarning: ${warns}/3`,
        threadID
      );
    }
  }
};
