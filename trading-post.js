const Discord = require('discord.js');
const fs = require('fs');

const handleTradingPostCommand = (msg, client) => {
  let tradingData = JSON.parse(fs.readFileSync("./trading-data.json", "utf-8"));
  let msgParts = msg.toString().split(' ');
  let { attachments } = msg;

  // If not follwing the instructions
  if (msgParts.length !== 3) {
    return msg.delete().then(() => {
      return msg.reply("hmm... it seems your command is malformed, sorry try again.").then(m => m.delete({ timeout: 5000 }).then(null, err => console.error(err)))
    }, (err) => console.error(err));
  }
  if (attachments.size === 0) {
    return msg.delete().then(() => {
      return msg.reply("hey you need to put that command as a comment on your whiteboard image upload please").then(m => m.delete({ timeout: 5000 }).then(null, err => console.error(err)))
    }, (err) => console.error(err));
  }

  let roomNum = parseInt(msgParts[2], 10);

  if (isNaN(roomNum) || roomNum < 1000 || roomNum > 6000) {
    return msg.delete().then(() => {
      return msg.reply("uh... so this is awkward. I can't seem to figure out what you meant by that room number. Try again.").then(m => m.delete({ timeout: 5000 }).then(null, err => console.error(err)))
    }, (err) => console.error(err));
  }
  if (msg.member.displayName.indexOf(roomNum) < 0) {
    return msg.delete().then(() => {
      return msg.reply("sorry, you can only edit your own trading post. If this is an error, make sure your room number is in your nickname and you enter it correctly.").then(m => m.delete({ timeout: 5000 }).then(null, err => console.error(err)))
    }, (err) => console.error(err));
  }

  tradingData[roomNum] = {
    ...tradingData[roomNum],
    roomNum,
    whiteboardImg: attachments.first().url,
    updatedBy: msg.member.displayName,
    updatedAt: msg.createdAt.toISOString()
  }

  const tpEmbed = new Discord.MessageEmbed().setImage(tradingData[roomNum].whiteboardImg).setDescription(`Updated by: ${tradingData[roomNum].updatedBy}`).setTitle(`${roomNum}'s Trading Post`)

  if (tradingData[roomNum].msgId) {
    client.channels.fetch('748767266195374150').then(tpChannel => {
      tpChannel.messages.fetch(tradingData[roomNum].msgId).then(tpMsg => {
        tpMsg.edit(tpEmbed).then(() => {
          fs.writeFile("./trading-data.json", JSON.stringify(tradingData, null, 2), (err) => {
            if (err) return console.error(new Error("Couldn't save tradingData. Code 1."))
            return msg.reply("okay, I updated your post!").then(m => m.delete({ timeout: 5000 }).then(null, err => console.error(err)))
          })
        }, err => console.error(err))
      }, err => console.error(err))
    }, err => console.error(err))
  } else {
    tradingData[roomNum].createdAt = msg.createdAt.toISOString();
    tradingData[roomNum].createdBy = msg.member.displayName;

    client.channels.fetch('748767266195374150').then(tpChannel => {
      tpChannel.send(tpEmbed).then(tpMsg => {
        tradingData[roomNum].msgId = tpMsg.id;
        fs.writeFile("./trading-data.json", JSON.stringify(tradingData, null, 2), (err) => {
          if (err) return console.error(new Error("Couldn't save tradingData. Code 1."))
          return msg.reply("okay, I created your post!").then(m => m.delete({ timeout: 5000 }).then(null, err => console.error(err)))
        })
      }, err => console.error(err))
    }, err => console.error(err))
  }
}

module.exports = { handleTradingPostCommand }