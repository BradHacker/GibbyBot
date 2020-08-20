const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('res'))

app.get('/', (req, res) => res.sendFile('index.html', { root: __dirname }))

app.listen(port, () => console.log(`Gibby bot is listening on ${port}`))

const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs')
const UTIL = require('./util')
const fetch = require('node-fetch');
var FormData = require('form-data');

let isSleeping = false;

const quotes = require('./quotes.json');
console.log("Quotes are loaded");
const prefs = require('./prefs.json')
console.log("Prefs are loaded");

if (!fs.existsSync('memes.json')) fs.writeFileSync("memes.json", "[]");

let memes = [];
fs.readFile("memes.json", (err, data) => {
  if (err) return console.error.bind(err);
  memes = JSON.parse(data);
  console.log("Memes are loaded");
})

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`)
  let channel = client.channels.cache.find(channel => channel.name === (prefs.testMode ? 'gibby-test' : prefs.mainChannel))
  if (channel) {
    shouldSleep(channel);
    channel.send(isSleeping ? prefs.sleepMessage : prefs.awakeMessage).catch(err => console.error(err))
    setInterval(() => shouldSleep(channel), 300000);
  }
  else console.error("couldn't find main channel")
})

client.on('error', err => {
  console.error(err)
})

const shouldSleep = (channel) => {
  const hour = new Date().getHours();
  if (hour > 1 && hour < 9 && !isSleeping) {
    isSleeping = true;
    channel.send(prefs.sleepMessage).catch(err => console.error(err))
    return;
  }
  if (hour > 9 && isSleeping) {
    isSleeping = false;
    channel.send(prefs.awakeMessage).catch(err => console.error(err))
    return;
  }
}

Discord.GuildMember.prototype.isAdmin = function() {
  // console.log(this)
  if (this.roles.cache.find(r => prefs.adminRoles.filter(ar => ar === r.name).length > 0)) return true;
  return false;
}

client.on('guildMemberAdd', member => {
  if (isSleeping) return;
  // Send the message to a designated channel on a server:
  let channel = client.channels.cache.find(channel => channel.name === prefs.mainChannel)
  if (!channel) return;
  channel.send(`**${member.user.username}**, ${prefs.welcomeMessage}`)
});

client.on('message', msg => {
  if (msg.author.tag === client.user.tag) return;
  if (prefs.excludedChannels.filter(c => c === msg.channel.name).length > 0) return;

  if (/bucket/i.test(msg.toString()) && !isSleeping) msg.react('🥣')

  if (/gibby/i.test(msg.toString())) {
    if (isSleeping) return msg.channel.send('💤');
    if (/chat/i.test(msg.toString())) {
      let lineBegin = msg.toString().indexOf('gibby chat') + 5;
      if (lineBegin < 0) return msg.reply('pls use `gibby chat` before your message to chat with me')
      let formData = new FormData();
      formData.append('question', msg.toString().slice(lineBegin).trim())
      return fetch('https://boredhumans.com/process_chat.php', { method: 'post', body: formData }).then(response => response.text()).then(data => {
        let textStart = data.indexOf("<class=\"answer\">") + 16;
        let textEnd = data.indexOf("</p>");
        let returnMsg = data.slice(textStart, textEnd);
        if (returnMsg.length > 2000) return msg.reply('well, i can\'t say anything...')
        return msg.reply(returnMsg.replace('<br>','\n').replace('<b>','**').replace('</b>','**').replace('<em>','*').replace('</em>','*'));
      }).catch(err => {
        return console.error(err);
      })
    }
    if (/praise/i.test(msg.toString())) msg.react('✨')
    if (prefs.testMode) {
      if (msg.channel.name !== 'gibby-test') return msg.reply("I'm in test mode right now, sorry for the inconvenience");
    }
    if (/help/i.test(msg.toString())) {
      let helpText = fs.readFileSync("helpText.txt", 'utf8');
      return msg.channel.send(helpText);
    }
    if (/preferences/i.test(msg.toString()) && msg.member.isAdmin()) {
      if (/awakeMessage/i.test(msg.toString())) {
        prefs.awakeMessage = msg.toString().slice(msg.toString().indexOf('awakeMessage') + 12);
        return fs.writeFile("prefs.json", JSON.stringify(prefs, null, 2), () => msg.reply("Preferences saved."))
      }
      if (/callouts/i.test(msg.toString())) {
        prefs.callouts = !prefs.callouts
        return fs.writeFile("prefs.json", JSON.stringify(prefs, null, 2), () => msg.reply(`Preferences saved. Callouts are now ${prefs.callouts ? 'on' : 'off'}`))
      }
      if (/addQuote/i.test(msg.toString())) {
        let newQuote = msg.toString().slice(msg.toString().indexOf('addQuote') + 8);
        quotes.push(newQuote)
        return fs.writeFile("quotes.json", JSON.stringify(quotes, null, 2), () => msg.reply(`okay I'll remember your quote "${newQuote}"`))
      }
      if (/mainChannel/i.test(msg.toString())) {
        let newChannel = msg.toString().slice(msg.toString().indexOf('mainChannel') + 11)
        prefs.mainChannel = newChannel.trim();
        return fs.writeFile("prefs.json", JSON.stringify(prefs, null, 2), () => msg.reply(`Preferences saved. Main channel is now #${prefs.mainChannel}`))
      }
    }
    if (/quote/i.test(msg.toString())) {
      if (/inspirational/i.test(msg.toString())) {
        msg.reply("Coming right up...")
        return fetch('https://inspirobot.me/api?generate=true').then(res => res.text()).then(url => {
          msg.channel.send({ files: [url] })
        }).catch(err => console.error.bind(err))
      }
      return msg.channel.send(quotes[Math.floor(Math.random() * quotes.length)])
    }
    if (/meme/i.test(msg.toString())) {
      if (/save/i.test(msg.toString()) || /look at/i.test(msg.toString())) {
        if (msg.attachments.array().length === 0) {
          return msg.channel.messages.fetch({ limit: 10 }).then(messages => {
            let prevMessage = messages.filter(m => m.attachments.array().length > 0).array()[0];
            if (!prevMessage) {
              console.log
              return msg.reply("you need to include a meme for me to save tho")
            }
            return UTIL.saveMeme(prevMessage, memes, msg);
          }).catch(err => {
            console.error(err);
            console.error("couldn't get message")
            return msg.reply("i couldn't grab your last message, sorry. try again later")
          })
        }
        return UTIL.saveMeme(msg, memes);
      }
      if (/gimme/i.test(msg.toString())) {
        const randMeme = memes[Math.floor(Math.random() * memes.length)]
        return msg.channel.send(randMeme.caption || "Here's an uncaptioned meme", {
          files: [randMeme.url],
        })
      }
    }
    if (/home/i.test(msg.toString())) {
      return msg.channel.send('my home... https://GibbyBot.bradhacker.repl.co')
    }
    if (/(thank you)|(thanks)/i.test(msg.toString())) {
      return msg.reply('you are welcome my child')
    }
    if (/how are you/i.test(msg.toString())) {
      return msg.reply('i am doing... well... how can we be sure we are doing anything? reality is only our neurons firing in response to the stimuli around us')
    }
    if (/dame da ne/i.test(msg.toString())) {
      return msg.channel.send("This is my word...", { files: ["https://cdn.discordapp.com/attachments/728321787263189097/744944328799027270/Gibby_Mitai.mp4"] })
    }
    if (/covid/i.test(msg.toString())) {
      return msg.channel.send('Please remember to social distance and wear masks!')
    }
    if(/rap for me/i.test(msg.toString())) {
      msg.reply("Okay, give me a second to get set up...")
      return fetch('http://deepbeat.org/deepbeat.fcgi?l=en&nn=false&k=&m=multi&q=&q=&q=&q=&q=&q=&q=&q=').then(response => response.json()).then(data => {
        msg.channel.send(data.rhymes.map(r => r.line).join('\n') + '\n*drops the mic*')
      })
    }
    if (/uptime/i.test(msg.toString())) {
      
    }
    return prefs.callouts ? msg.reply('I hear your call...') : msg.channel.send('I hear your call...')
  }
})

client.login(process.env.TOKEN);