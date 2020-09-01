const fs = require('fs')
const ytdl = require('ytdl-core');
const Discord = require('discord.js')

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
  caption = caption.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
  caption = caption.replace(/\n/,'');
  if (caption.indexOf('@') >= 0) return msg.reply('Damn son, you thought you could at someone')
  if (/(https:\/\/(www.)?youtube)|(https:\/\/(www.)?youtu.be)/ig.test(msg.toString())) {
    let ytURLIndex = msg.toString().indexOf("youtube") >= 0 ? msg.toString().indexOf("youtube") : msg.toString().indexOf("youtu.be");
    if (ytURLIndex === -1) return msg.reply("bro, seriously?! you forgot the actual meme part of that");
    let ytURL = msg.toString().slice(ytURLIndex);
    ytURL = ytURL.slice(0, ytURL.indexOf(' ') === -1 ? undefined : ytURL.indexOf(' '));
    if (ytdl.validateURL(ytURL)) {
      let video = ytdl(ytURL, { filter: format => format.container === 'mp4' });
      video.pipe(fs.createWriteStream("temp.mp4"))
      // video.on('end', () => console.log('end', video))
      video.on('error', console.error)
      let videoBuffs = []
      video.on('data', (data) => videoBuffs.push(data))
      return video.on('progress', (chunkSize, downloaded, total) => {
        if (downloaded === total) {
          return msg.client.channels.fetch('750137587376717925').then(c => c.send(new Discord.MessageAttachment("./temp.mp4")).then((m) => {
            fs.unlink("./temp.mp4", (err) => err && console.error("couldn't delete temp.mp4"))
            memes.push({ url: m.attachments.first().url, caption, submittedAt: new Date().toISOString() });
            return fs.writeFile("memes.json", JSON.stringify(memes, null, 2), () => msg.reply(`okay I saved your meme titled: ${caption}.`))
          }))
        }
      })
      // return msg.channel.send({
      //   files: []
      // })
      // .then(m => m.delete().then(() => undefined).catch(console.error))
    }
  }
  memes.push({ url: msg.attachments.first().url, caption, submittedAt: new Date().toISOString() });
  return fs.writeFile("memes.json", JSON.stringify(memes, null, 2), () => msg.reply(`okay I saved your meme titled: ${caption}.`))
}

module.exports = {
  saveMeme
}