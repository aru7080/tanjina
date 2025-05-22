const { getTime, drive } = global.utils;

if (!global.temp.welcomeEvent)
  global.temp.welcomeEvent = {};

module.exports = {
  config: {
    name: "welcome",
    version: "2.1",
    author: "NTKhang + Fixed by ChatGPT",
    category: "events"
  },

  langs: {
    en: {
      session1: "morning",
      session2: "noon",
      session3: "afternoon",
      session4: "evening",
      multiple1: "you",
      multiple2: "you guys",
      defaultWelcomeMessage:
`🥰 𝙰𝚂𝚂𝙰𝙻𝙰𝙼𝚄𝙰𝙻𝙰𝙸𝙺𝚄𝙼 {userNameTag}, 𝚠𝚎𝚕𝚌𝚘𝚖𝚎 {multiple} 𝚃𝚘 𝙾𝚞𝚛 『{boxName}』 𝙶𝚛𝚘𝚞𝚙 😊
• 𝙸 𝙷𝚘𝚙𝚎 𝚈𝚘𝚞 𝚆𝚒𝚕𝚕 𝙵𝚘𝚕𝚕𝚘𝚠 𝙾𝚞𝚛 𝙶𝚛𝚘𝚞𝚙 𝚁𝚞𝚕𝚎𝚜
• {prefix}rules - 𝙶𝚛𝚘𝚞𝚙 𝚁𝚞𝚕𝚎𝚜
• {prefix}help - 𝙰𝚕𝚕 𝙲𝚘𝚖𝚖𝚊𝚗𝚍𝚜

• 𝚈𝚘𝚞 𝙰𝚛𝚎 𝚃𝚑𝚎 {memberIndex} 𝙼𝚎𝚖𝚋𝚎𝚛{memberPlural} 𝙸𝚗 𝙾𝚞𝚛 𝙶𝚛𝚘𝚞𝚙
• 𝙰𝚍𝚍𝚎𝚍 𝙱𝚢: {inviterName}`
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang, usersData }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const hours = getTime("HH");
    const { threadID } = event;
    const { nickNameBot } = global.GoatBot.config;
    const prefix = global.utils.getPrefix(threadID);
    const dataAddedParticipants = event.logMessageData.addedParticipants;

    // Bot was added
    if (dataAddedParticipants.some(u => u.userFbId == api.getCurrentUserID())) {
      if (nickNameBot)
        api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
      return message.send(getLang("defaultWelcomeMessage", prefix));
    }

    if (!global.temp.welcomeEvent[threadID])
      global.temp.welcomeEvent[threadID] = {
        joinTimeout: null,
        dataAddedParticipants: []
      };

    global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
    clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

    global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
      const threadData = await threadsData.get(threadID);
      const settings = threadData.settings || {};

      if (settings.sendWelcomeMessage === false) {
        console.log("[Welcome] sendWelcomeMessage is turned off.");
        return;
      }

      const addedUsers = global.temp.welcomeEvent[threadID].dataAddedParticipants;
      const dataBanned = threadData.data?.banned_ban || [];
      const threadName = threadData.threadName || "this group";

      const mentions = [];
      const names = [];

      for (const user of addedUsers) {
        if (dataBanned.some(b => b.id == user.userFbId)) continue;
        names.push(user.fullName);
        mentions.push({ tag: user.fullName, id: user.userFbId });
      }

      if (names.length === 0) return;

      const welcomeMsgTemplate = threadData.data?.welcomeMessage || getLang("defaultWelcomeMessage");

      const memberInfo = await api.getThreadInfo(threadID);
      const memberCount = memberInfo.participantIDs.length;

      // Member position
      const memberIndexList = [];
      for (let i = memberCount - names.length + 1; i <= memberCount; i++) {
        memberIndexList.push(i + getNumberSuffix(i));
      }

      // Get inviter name
      let inviterName = "Unknown";
      try {
        inviterName = await usersData.getName(event.author) || "Unknown";
      } catch (err) {
        console.warn("Could not get inviter name:", err.message);
      }

      // Message prepare
      const form = {
        body: welcomeMsgTemplate
          .replace(/\{userNameTag\}/g, names.join(", "))
          .replace(/\{multiple\}/g, names.length > 1 ? getLang("multiple2") : getLang("multiple1"))
          .replace(/\{boxName\}/g, threadName)
          .replace(/\{memberIndex\}/g, memberIndexList.join(", "))
          .replace(/\{memberPlural\}/g, names.length > 1 ? "s" : "")
          .replace(/\{inviterName\}/g, inviterName)
          .replace(/\{prefix\}/g, prefix),
        mentions
      };

      // Attachment support
      if (threadData.data?.welcomeAttachment) {
        const files = threadData.data.welcomeAttachment;
        const attachments = files.map(file => drive.getFile(file, "stream"));
        form.attachment = (await Promise.allSettled(attachments))
          .filter(r => r.status === "fulfilled")
          .map(r => r.value);
      }

      message.send(form);
      delete global.temp.welcomeEvent[threadID];
    }, 1500);
  }
};

// Helper function: ordinal suffix (e.g., 1st, 2nd)
function getNumberSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
