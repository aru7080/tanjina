const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
  config: {
    name: "welcome",
    version: "2.1",
    author: "@ARIYAN",
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
`𝐀𝐒𝐒𝐀𝐋𝐀𝐌𝐔𝐀𝐋𝐀𝐈𝐊𝐔𝐌 {userNameTag} ❤️

𝐖𝐞𝐥𝐜𝐨𝐦𝐞 {multiple} 𝐓𝐨 𝐎𝐮𝐫 『{boxName}』 𝐆𝐫𝐨𝐮𝐩!

━━━━━━━━━━━━━━━━━━
𝐑𝐮𝐥𝐞𝐬 𝐨𝐟 𝐎𝐮𝐫 𝐂𝐨𝐦𝐦𝐮𝐧𝐢𝐭𝐲:
• Use {prefix}rules to read group rules
• Use {prefix}help to explore bot commands

𝐘𝐨𝐮 𝐚𝐫𝐞 𝐭𝐡𝐞 {memberIndex} 𝐦𝐞𝐦𝐛𝐞𝐫{memberPlural} 𝐨𝐟 𝐭𝐡𝐞 𝐠𝐫𝐨𝐮𝐩!
𝐀𝐝𝐝𝐞𝐝 𝐛𝐲: {inviterName}`
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const { nickNameBot } = global.GoatBot.config;
    const prefix = global.utils.getPrefix(threadID);
    const dataAddedParticipants = event.logMessageData.addedParticipants;

    // Bot added
    if (dataAddedParticipants.some(u => u.userFbId == api.getCurrentUserID())) {
      if (nickNameBot)
        api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
      return message.send(getLang("welcomeMessage", prefix));
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
      if (threadData.settings.sendWelcomeMessage === false) return;

      const addedUsers = global.temp.welcomeEvent[threadID].dataAddedParticipants;
      const dataBanned = threadData.data.banned_ban || [];
      const threadName = threadData.threadName;
      const mentions = [];
      const names = [];

      for (const user of addedUsers) {
        if (dataBanned.some(ban => ban.id == user.userFbId)) continue;
        names.push(user.fullName);
        mentions.push({ tag: user.fullName, id: user.userFbId });
      }

      if (names.length === 0) return;

      const welcomeMsgTemplate = threadData.data.welcomeMessage || getLang("defaultWelcomeMessage");
      const memberInfo = await api.getThreadInfo(threadID);
      const memberCount = memberInfo.participantIDs.length;

      // Member index
      const memberIndexList = [];
      for (let i = memberCount - names.length + 1; i <= memberCount; i++) {
        memberIndexList.push(i + getNumberSuffix(i));
      }

      // Get inviter name
      const inviterID = event.logMessageData.inviterID || event.senderID;
      let inviterName = "Unknown";
      let inviterMention = { tag: "Unknown", id: inviterID };

      try {
        const info = await api.getUserInfo(inviterID);
        inviterName = info[inviterID]?.name || "Unknown";
        inviterMention = { tag: inviterName, id: inviterID };
      } catch (e) {
        console.warn("Failed to fetch inviter name:", e.message);
      }

      mentions.push(inviterMention);

      const form = {
        body: welcomeMsgTemplate
          .replace(/\{userNameTag\}/g, names.join(", "))
          .replace(/\{multiple\}/g, names.length > 1 ? getLang("multiple2") : getLang("multiple1"))
          .replace(/\{boxName\}/g, threadName)
          .replace(/\{memberIndex\}/g, memberIndexList.join(", "))
          .replace(/\{memberPlural\}/g, names.length > 1 ? "s" : "")
          .replace(/\{inviterName\}/g, `@${inviterName}`)
          .replace(/\{prefix\}/g, prefix),
        mentions
      };

      // Attachments (if any)
      if (threadData.data.welcomeAttachment) {
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

function getNumberSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
