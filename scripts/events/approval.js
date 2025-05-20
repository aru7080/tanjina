const { MongoClient } = require('mongodb');
const { getStreamFromURL } = global.utils;

const uri = `${global.GoatBot.config.database.uriMongodb}`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

module.exports = {
  config: {
    name: "approval",
    version: "1.2",
    author: "Mahi--",
    category: "events"
  },

  onStart: async function ({ api, event, threadsData, message }) {
    if (!db) {
      try {
        await client.connect();
        db = client.db('Approve');
        console.log("Connected to MongoDB successfully.");
      } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        return message.reply("Database connection failed.");
      }
    }

    const adminUid = "61569320200485";
    const groupId = event.threadID;
    const threadData = await threadsData.get(groupId);
    const groupName = threadData.threadName;
    const { getPrefix } = global.utils;
    const prefix = getPrefix(event.threadID);
    const specialThreadId = "8008566255928114";

    const collection = db.collection('approvedThreads');

    if (event.logMessageType === "log:subscribe" && event.author === adminUid) {
      await collection.updateOne({ _id: groupId }, { $set: { _id: groupId, status: "approved" } }, { upsert: true });
      return message.reply(`✅ | Group ${groupName} has been automatically approved since the bot was added by the admin.`);
    }

    const isApproved = await collection.findOne({ _id: groupId });

    if (!isApproved && event.logMessageType === "log:subscribe") {
      try {
        await message.send({
          body: `❎ | You Added The Anchestor Without Permission !!\n\n✧ Take Permission From Anchestor's Admin to Use Anchestor In Your Group !!\n✧ Join Anchestor Support Group Chat to Contact Admins !!\n\n✧ Type ${prefix}supportgc within 20 seconds.\n\n- Anchestor Co., Ltd.`,
          attachment: await getStreamFromURL("https://i.imgur.com/p62wheh.gif")
        });

        await new Promise((resolve) => setTimeout(resolve, 20000));

        const approvalStatusAfterDelay = await collection.findOne({ _id: groupId });

        if (!approvalStatusAfterDelay) {
          await api.sendMessage(`====== Approval Required ======\n\n🍁 | Group: ${groupName}\n🆔 | TID: ${groupId}\n☣️ | Event: Group requires approval.`, adminUid);

          await api.sendMessage(`====== Approval Required ======\n\n🍁 | Group: ${groupName}\n🆔 | TID: ${groupId}\n☣️ | Event: Group requires approval.`, specialThreadId);

          console.log(`Attempting to remove bot from group: ${groupId}`);
          await api.removeUserFromGroup(api.getCurrentUserID(), groupId);
        } else {
          console.log(`Group ${groupId} approved during the delay period. No action required.`);
        }
      } catch (err) {
        console.error("Error during approval process:", err);
        await message.reply("An error occurred while processing your request.");
      }
    }
  }
};
