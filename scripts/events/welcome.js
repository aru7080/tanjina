const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "1.7",
		author: "NTKhang + customized",
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			welcomeMessage: "Cảm ơn bạn đã mời tôi vào nhóm!\nPrefix bot: %1\nĐể xem danh sách lệnh hãy nhập: %1help",
			multiple1: "bạn",
			multiple2: "các bạn",
			defaultWelcomeMessage: "🥰 𝘼𝙨𝙨𝙖𝙡𝙖𝙢𝙪 𝘼𝙡𝙖𝙞𝙠𝙪𝙢 {userNameTag}\n✨ 𝙒𝙚𝙡𝙘𝙤𝙢𝙚 {multiple} 𝙩𝙤 𝙤𝙪𝙧 𝙜𝙧𝙤𝙬𝙞𝙣𝙜 𝙛𝙖𝙢𝙞𝙡𝙮: 『{boxName}』!\n\n🌟 𝙔𝙤𝙪 𝙖𝙧𝙚 𝙩𝙝𝙚 {memberCount} 𝙥𝙧𝙚𝙘𝙞𝙤𝙪𝙨 𝙢𝙚𝙢𝙗𝙚𝙧{memberPlural}\n• 𝘼𝙙𝙙𝙚𝙙 𝙗𝙮: {inviterName}\n\n☀️ 𝙒𝙞𝙨𝙝𝙞𝙣𝙜 𝙮𝙤𝙪 𝙖 𝙬𝙤𝙣𝙙𝙚𝙧𝙛𝙪𝙡 {session} ahead!\n\n➤ 𝙋𝙡𝙚𝙖𝙨𝙚 𝙧𝙚𝙖𝙙 𝙤𝙪𝙧 𝙧𝙪𝙡𝙚𝙨: {prefix}rules\n➤ 𝙀𝙭𝙥𝙡𝙤𝙧𝙚 𝙘𝙤𝙤𝙡 𝙘𝙤𝙢𝙢𝙖𝙣𝙙𝙨: {prefix}help\n\n𝙃𝙖𝙫𝙚 𝙛𝙪𝙣 & 𝙚𝙣𝙟𝙤𝙮 𝙩𝙝𝙚 𝘾𝙃𝘼𝙏!"
		},
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			welcomeMessage: "Thank you for inviting me to the group!\nBot prefix: %1\nTo view the list of commands, please enter: %1help",
			multiple1: "you",
			multiple2: "you guys",
			defaultWelcomeMessage: "🥰 𝘼𝙨𝙨𝙖𝙡𝙖𝙢𝙪 𝘼𝙡𝙖𝙞𝙠𝙪𝙢 {userNameTag}\n✨ 𝙒𝙚𝙡𝙘𝙤𝙢𝙚 {multiple} 𝙩𝙤 𝙤𝙪𝙧 𝙜𝙧𝙤𝙬𝙞𝙣𝙜 𝙛𝙖𝙢𝙞𝙡𝙮: 『{boxName}』!\n\n🌟 𝙔𝙤𝙪 𝙖𝙧𝙚 𝙩𝙝𝙚 {memberCount} 𝙥𝙧𝙚𝙘𝙞𝙤𝙪𝙨 𝙢𝙚𝙢𝙗𝙚𝙧{memberPlural}\n• 𝘼𝙙𝙙𝙚𝙙 𝙗𝙮: {inviterName}\n\n☀️ 𝙒𝙞𝙨𝙝𝙞𝙣𝙜 𝙮𝙤𝙪 𝙖 𝙬𝙤𝙣𝙙𝙚𝙧𝙛𝙪𝙡 {session} ahead!\n\n➤ 𝙋𝙡𝙚𝙖𝙨𝙚 𝙧𝙚𝙖𝙙 𝙤𝙪𝙧 𝙧𝙪𝙡𝙚𝙨: {prefix}rules\n➤ 𝙀𝙭𝙥𝙡𝙤𝙧𝙚 𝙘𝙤𝙤𝙡 𝙘𝙤𝙢𝙢𝙖𝙣𝙙𝙨: {prefix}help\n\n𝙃𝙖𝙫𝙚 𝙛𝙪𝙣 & 𝙚𝙣𝙟𝙤𝙮 𝙩𝙝𝙚 𝘾𝙃𝘼𝙏!"
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType != "log:subscribe") return;

		const hours = getTime("HH");
		const { threadID } = event;
		const { nickNameBot } = global.GoatBot.config;
		const prefix = global.utils.getPrefix(threadID);
		const dataAddedParticipants = event.logMessageData.addedParticipants;

		if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
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
			if (threadData.settings.sendWelcomeMessage === false)
				return;

			const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
			const dataBanned = threadData.data.banned_ban || [];
			const threadName = threadData.threadName;
			const userName = [], mentions = [];
			let multiple = false;

			if (dataAddedParticipants.length > 1)
				multiple = true;

			for (const user of dataAddedParticipants) {
				if (dataBanned.some((item) => item.id == user.userFbId))
					continue;
				userName.push(user.fullName);
				mentions.push({ tag: user.fullName, id: user.userFbId });
			}
			if (userName.length == 0) return;

			let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;
			const form = {
				mentions: welcomeMessage.includes("{userNameTag}") ? mentions : null
			};

			const memberCount = (await api.getThreadInfo(threadID)).participantIDs.length;
			const inviterName = event.logMessageData.inviterName || "Unknown";

			welcomeMessage = welcomeMessage
				.replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
				.replace(/\{boxName\}|\{threadName\}/g, threadName)
				.replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
				.replace(/\{session\}/g, hours <= 10 ? getLang("session1") : hours <= 12 ? getLang("session2") : hours <= 18 ? getLang("session3") : getLang("session4"))
				.replace(/\{memberCount\}/g, memberCount)
				.replace(/\{inviterName\}/g, inviterName)
				.replace(/\{memberPlural\}/g, memberCount > 1 ? "s" : "");

			form.body = welcomeMessage;

			if (threadData.data.welcomeAttachment) {
				const files = threadData.data.welcomeAttachment;
				const attachments = files.reduce((acc, file) => {
					acc.push(drive.getFile(file, "stream"));
					return acc;
				}, []);
				form.attachment = (await Promise.allSettled(attachments))
					.filter(({ status }) => status == "fulfilled")
					.map(({ value }) => value);
			}

			await message.send(form);
			delete global.temp.welcomeEvent[threadID];
		}, 1500);
	}
};
