const fs = require('fs')

const saveMeme = (msg, memes, cmdMessage) => {
  let index = (cmdMessage ? cmdMessage : msg).toString().indexOf("it's titled");
  let cmdOffset = 12;
  if (index == -1) {
    index = (cmdMessage ? cmdMessage : msg).toString().indexOf("its titled");
    cmdOffset = 11
  }
  if (index == -1) {
    index = (cmdMessage ? cmdMessage : msg).toString().indexOf("title it");
    cmdOffset = 9;
  }
  let caption = index >= 0 ? (cmdMessage ? cmdMessage : msg).toString().slice(index + cmdOffset) : 'Untitled Meme';
  memes.push({ url: msg.attachments.first().url, caption });
  return fs.writeFile("memes.json", JSON.stringify(memes, null, 2), () => msg.reply(`okay I saved your meme titled: ${caption}.`))
}

module.exports = {
  saveMeme
}