const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
  config: {
    name: "welcome",
    version: "2.0",
    author: "Ariyan",
    category: "events"
  },

  langs: {
    en: {
      session1: "morning",
      session2: "noon",
      session3: "afternoon",
      session4: "evening",
      multiple1: "you",
      multiple2: "you guys"
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const hours = getTime("HH");
    const added = event.logMessageData.addedParticipants;

    if (!global.temp.welcomeEvent[threadID])
      global.temp.welcomeEvent[threadID] = { joinTimeout: null, dataAddedParticipants: [] };

    global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...added);
    clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

    global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
      const threadData = await threadsData.get(threadID);
      if (threadData?.settings?.sendWelcomeMessage === false) return;

      const addedList = global.temp.welcomeEvent[threadID].dataAddedParticipants;
      const threadName = threadData.threadName || "our group";
      const mentions = [];
      const nameList = [];

      let allMentions = "";
      for (const user of addedList) {
        nameList.push(user.fullName);
        mentions.push({ tag: user.fullName, id: user.userFbId });
        allMentions += user.fullName + ", ";
      }

      if (nameList.length === 0) return;

      const multiple = nameList.length > 1 ? getLang("multiple2") : getLang("multiple1");
      const memberInfo = await api.getThreadInfo(threadID);
      const memberIDs = memberInfo.participantIDs || [];
      const memberIndexes = addedList.map(u => memberIDs.indexOf(u.userFbId) + 1);
      const indexText = memberIndexes.map(i => `${i}${ordinalSuffix(i)}`).join(", ");
      const inviter = event.logMessageData.inviterName || "Unknown";

      const session =
        hours <= 10 ? getLang("session1")
        : hours <= 12 ? getLang("session2")
        : hours <= 18 ? getLang("session3")
        : getLang("session4");

      const body = 
`🥰 𝙰𝚂𝚂𝙰𝙻𝙰𝙼𝚄𝙰𝙻𝙰𝙸𝙺𝚄𝙼 ${nameList.join(", ")}
✨ Welcome ${multiple} To Our 『${threadName}』 Group!

• 𝙸 𝙷𝚘𝚙𝚎 𝚈𝚘𝚞 𝚆𝚒𝚕𝚕 𝚏𝚘𝚕𝚕𝚘𝚠 𝙾𝚞𝚛 𝙶𝚛𝚘𝚞𝚙 𝚁𝚞𝚕𝚎𝚜
• !𝚛𝚞𝚕𝚎𝚜 𝚏𝚘𝚛 𝙶𝚛𝚘𝚞𝚙 𝚛𝚞𝚕𝚎𝚜
• !𝚑𝚎𝚕𝚙 𝙵𝚘𝚛 𝚊𝚕𝚕 𝙲𝚘𝚖𝚖𝚊𝚗𝚍

• 𝚈𝚘𝚞 𝙰𝚛𝚎 𝚃𝚑𝚎 ${indexText} 𝙼𝚎𝚖𝚋𝚎𝚛${memberIndexes.length > 1 ? "s" : ""} 𝚒𝚗 𝙾𝚞𝚛 𝙶𝚛𝚘𝚞𝚙
• 𝙰𝚍𝚍𝚎𝚍 𝙱𝚢: ${inviter}
`;

      const form = {
        body,
        mentions
      };

      // Attachments if set
      if (threadData?.data?.welcomeAttachment?.length) {
        const files = threadData.data.welcomeAttachment;
        const attachments = files.map(f => drive.getFile(f, "stream"));
        const resolved = await Promise.allSettled(attachments);
        form.attachment = resolved.filter(r => r.status === "fulfilled").map(r => r.value);
      }

      message.send(form);
      delete global.temp.welcomeEvent[threadID];
    }, 1500);
  }
};

function ordinalSuffix(i) {
  const j = i % 10,
        k = i % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}
