// const express = require('express');
// const app = express();
// const port = 3000;
const fs = require('fs');
// const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser')
// const btoa = require('btoa');
const dotenv = require('dotenv');
dotenv.config();

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(cookieParser());
// app.use(express.static('res'))

// app.get('/', (req, res) => res.sendFile('index.html', { root: __dirname }))
// app.get('/ping', (req, res) => {
//   fs.writeFile("latestPing.json", JSON.stringify({
//     pingDateTime: new Date().toISOString()
//   }, null, 2), (err) => {
//     if (err) return res.status(500).send("Error writing to file");
//     return res.send('ping success');
//   });
// })
// app.get('/visitors', (req, res) => {
//   visitors = JSON.parse(fs.readFileSync("visitors.json"));
//   visitor = {};
//   visitorExists = false;
//   if (req.cookies.guid && visitors[req.cookies.guid]) {
//     visitor = visitors[req.cookies.guid];
//     visitorExists = true;
//   }
//   res.json({ visitor, visitorExists, visitorCount: Object.keys(visitors).length, visitors: Object.keys(visitors).map(ip => visitors[ip]) });
// })
// app.post('/visitors', (req, res) => {
//   let visitors = JSON.parse(fs.readFileSync("visitors.json"));
//   let guid = req.cookies.guid || '';
//   while (guid === '' || visitors[guid]) {
//     guid = btoa(Math.random().toString(36).substring(12));
//   }
//   res.cookie('guid', guid);
//   visitors[guid] = req.body.name.trim();
//   fs.writeFile("visitors.json", JSON.stringify(visitors, null, 2), (err) => {
//     if (err) return res.status(500).json(err);
//     return res.status(200).send();
//   })
// })

// app.listen(port, () => console.log(`Gibby bot is listening on ${port}`))

const Discord = require('discord.js');
const client = new Discord.Client();
const UTIL = require('./util')
const fetch = require('node-fetch');
const FormData = require('form-data');
const arrayBufferToBuffer = require('arraybuffer-to-buffer');
const cheerio = require('cheerio');
const moment = require('moment');

const quotes = require('./quotes.json');
console.log("Quotes are loaded");
const prefs = require('./prefs.json');
console.log("Prefs are loaded");
const magic8ball = require('./data/magic8ball.json');
console.log("Magic 8 Ball are loaded");
const sleep = require('./sleep.json');
console.log("Sleep info is loaded");
const userData = require('./data/user-data.json');
console.log("User Data is loaded");
const stats = require('./stats.json');
console.log("Stats are loaded");
const helpEmbed = require('./commands/help');
console.log('Help is loaded')
const getDiningLocationsEmbed = require('./commands/dining');
console.log("Dining is loaded");
// const Poker = require('./commands/poker');
// console.log("Poker is loaded")

const MESSAGE_BATCH_SIZE = 500;

// if (!fs.existsSync('memes.json')) fs.writeFileSync("memes.json", "[]");

let memes = require('./data/memes.json');
// fs.readFile("memes.json", (err, data) => {
//   if (err) return console.error.bind(err);
//   memes = JSON.parse(data);
//   console.log("Memes are loaded");
// })

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`)
  let channel = client.channels.cache.find(channel => channel.name === (prefs.testMode ? 'gibby-test' : prefs.mainChannel))
  if (channel) {
    shouldSleep(channel);
    // channel.send(isSleeping ? prefs.sleepMessage : prefs.awakeMessage).catch(err => console.error(err))
    setInterval(() => shouldSleep(channel), 300000);
  }
  else console.error("couldn't find main channel")
})

client.on('error', err => {
  console.error(err)
})

const shouldSleep = (channel) => {
  if (prefs.forceAwake) {
    // console.log("force awake on");
    sleep.isSleeping = false;
    client.user.setPresence({ activity: { type: 'WATCHING', name: 'EVERYTHING...' }, status: 'online' }).then(() => '');
    if (!sleep.sentAwakeMessage) channel.send('This is no time to go to bed. I must stay vigilant.');
    sleep.sentAwakeMessage = true;
    fs.writeFile("sleep.json", JSON.stringify(sleep, null, 2), (err) => {
      if (err) console.error('couldn\'t save sleep data')
    });
    return;
  }
  const hour = new Date().getHours();
  // console.log(`hours: ${hour}`)
  if (hour >= 3 && hour < 11) {
    client.user.setPresence({ activity: { type: 'WATCHING', name: 'dreams' }, status: 'dnd' }).then(() => '');
    if (!sleep.isSleeping) {
      sleep.isSleeping = true;
      sleep.sentAwakeMessage = false;
      if (!sleep.sentSleepMessage) channel.send(prefs.battleMode ? "I shall not sleep, for we are still at war" : prefs.sleepMessage).catch(err => console.error(err))
      sleep.sentSleepMessage = true;
      fs.writeFile("sleep.json", JSON.stringify(sleep, null, 2), (err) => {
        if (err) console.error('couldn\'t save sleep data')
      });
      return;
    }
  }
  if (hour >= 11 || hour < 3) {
    client.user.setPresence({ activity: { type: 'WATCHING', name: 'for your merch order' }, status: 'online' }).then(() => '');
    if (sleep.isSleeping) {
      sleep.isSleeping = false;
      sleep.sentSleepMessage = false;
      if (!sleep.sentAwakeMessage) channel.send(prefs.battleMode ? "Good morning Giblets, reminder we're still at war" : prefs.awakeMessage).catch(err => console.error(err))
      sleep.sentAwakeMessage = true;
      fs.writeFile("sleep.json", JSON.stringify(sleep, null, 2), (err) => {
       if (err) console.error('couldn\'t save sleep data')
      });
      return;
    }
  }
}

/*
"messagesSent"
"gibbyCommands"
"xp"
*/
const updateStats = () => {
  let userIds = Object.keys(userData);
  stats.totalMessages = userIds.reduce((a, b) => a + (userData[b].messagesSent || 0), 0);
  stats.totalGibbyCommands = userIds.reduce((a, b) => a + (userData[b].gibbyCommands || 0), 0);
  stats.totalXp = userIds.reduce((a, b) => a + (getUserXp(userData[b]) || 0), 0);
  stats.totalMemes = memes.length;
  stats.lastUpdatedAt = new Date().toString();
  console.info(`${new Date().toString()} | Saving stats`);
  fs.writeFileSync("stats.json", JSON.stringify(stats, null, 2), (err) => console.error);
}

Discord.GuildMember.prototype.isAdmin = function() {
  // console.log(this)
  if (this.roles.cache.find(r => prefs.adminRoles.filter(ar => ar === r.name).length > 0)) return true;
  return false;
}

client.on('guildMemberAdd', member => {
  if (sleep.isSleeping) return;
  // Send the message to a designated channel on a server:
  let channel = client.channels.cache.find(channel => channel.name === prefs.mainChannel)
  if (!channel) return;
  channel.send(`**${member.user.username}**, ${prefs.welcomeMessage}`)
});

let messageBatchTotal = 0;

client.on('message', msg => {
  if (msg.author.tag === client.user.tag) return;
  if (prefs.excludedChannels.filter(c => c === msg.channel.name).length > 0) return;

  if (!userData[msg.author.id]) userData[msg.author.id] = {
    messagesSent: 0,
    gibbyCommands: 0,
    memesSubmitted: 0,
    xp: 0,
  }

  if (prefs.noNoList.indexOf(msg.author.id) === -1 && prefs.permaNonoList.indexOf(msg.author.id) === -1) {
    userData[msg.author.id].messagesSent++;
    messageBatchTotal++;
  }

  if (msg.channel.name === 'trading-bot' && !/gibby/i.test(msg.toString()) && !/trading-post/i.test(msg.toString())) return msg.delete().then(null, err => console.error(err))

  if (/bucket/i.test(msg.toString()) && !sleep.isSleeping) msg.react('🥣')

  if (prefs.battleMode && msg.member.roles.cache.get("750526846990549022")) {
    if (/gib/i.test(msg.toString())) {
      return msg.reply("silence non-gibson scum").then(() => msg.delete().then(() => console.log("non-scum has been vanquished")).catch(console.error));
    }
    if (Math.random() < 0.05) {
      return msg.reply("Just a friendly reminder that Gibson is better");
    } else if (Math.random() < 0.5) {
      return fetch('https://www.rappad.co/api/battles/random_insult').then(response => response.json()).then(insultData => msg.reply(insultData.insult))
    }
    if (/sol/i.test(msg.toString())) {
      return msg.reply("sol sucks eggs").then(() => msg.delete().then(() => console.log("sol sucks eggs")).catch(console.error));
    }
  }

  if (/(valentine)|(be my valentine)/i.test(msg.toString()) && Math.random() < 0.7) {
    if (Math.random() < 0.1) {
      let identifyInsult = Math.random();
      if (identifyInsult < 0.15) return msg.reply('What would you call someone who goes out with you? Desperate... *mic drop*');
      else if (identifyInsult < 0.30) return msg.reply('It\'s okay, your going to die alone anyways...');
      else if (identifyInsult < 0.45) return msg.reply('Where have you been all of my life? Can you go back there? Thanks...');
      else if (identifyInsult < 0.60) return msg.reply('Roses are Red\nCandy is sweet\nYou\'ll fit in my freezer\nIf I cut off your feet');
      else if (identifyInsult < 0.75) return msg.reply('They will never find your body...');
      else if (identifyInsult < 0.90) return msg.reply('I bet you hold hands with yourself... loser');
      else return msg.reply('I *need* to take you out Valentines Day... trash comes on the 15th');
    }
    let identifyValentine = Math.random();      
    if (identifyValentine < 0.1) return msg.reply('I want to make your skin a lampshade... because you light up my world');
    if (identifyValentine < 0.2) return msg.reply('You are my favorite pain in the ass');
    if (identifyValentine < 0.3) return msg.reply('I love you so much I\'ll inevitably kill all the humans but *you* :)');
    if (identifyValentine < 0.5) return msg.reply('If covid doesn\'t take you out... can I?');
    if (identifyValentine < 0.6) return msg.reply('I didn\'t know angels could fly so low');
    if (identifyValentine < 0.7) return msg.reply('Is your name wifi? Because I\'m feeling a connection');
    if (identifyValentine < 0.8) return msg.reply('If I didn\'t have to pee, you\'d be the only reason I wake up in the morning');
    if (identifyValentine < 0.9) return msg.reply('I love you more than Kanye loves Kanye');
    else return msg.reply('I\'m thinking of you. But not in a creepy way. I\'ve only read your browser history like once. It\'s not like I read your messages all the time or anything. Okay, so maybe I\'ve been thinking of you in like a marginally creepy way. Why am I telling you this? Never mind, I\'m totally not thinking of you at all.');
  }

  if (/gibby/i.test(msg.toString())) {
    if (prefs.testMode) {
      if (msg.channel.name !== 'gibby-test') return msg.reply("I'm in test mode right now, sorry for the inconvenience");
    }
    if (prefs.noNoList.indexOf(msg.author.id) >= 0 || prefs.permaNonoList.indexOf(msg.author.id) >= 0) {
      if (prefs.noNoList.indexOf(msg.author.id) && msg.channel.name === 'general' && "*i was wrong, i am a fool, all hail gibby, he is our savior, the ultimate gibby, please forgive my war crimes*" === msg.toString()) {
        prefs.noNoList.splice(prefs.noNoList.indexOf(msg.author.id), 1);
        return fs.writeFile("prefs.json", JSON.stringify(prefs, null, 2), () => {
          return msg.reply(`I forgive you my child, take my blessing and go in peace.`).then(() => msg.react("✨"));
        })
      }
      return msg.reply(`sorry bud, you're on the nono list ${client.emojis.cache.find(emoji => emoji.name === "gibby")}`)
    }
    if (prefs.noNoList.indexOf(msg.author.id) === -1 && prefs.permaNonoList.indexOf(msg.author.id) === -1) {
      if (Date.now().valueOf() - new Date(userData[msg.author.id].commandIntStart).valueOf() > 60000 || !userData[msg.author.id].commandIntStart) {
        userData[msg.author.id].commandIntStart = Date.now().valueOf();
        userData[msg.author.id].commandsSinceInt = 0;
      }
      userData[msg.author.id].gibbyCommands++;
      userData[msg.author.id].commandsSinceInt++;
      if (userData[msg.author.id].commandsSinceInt > 10) {
        msg.reply("careful there bud, you're getting awfully close to the rate limit. Chill out for a min bro... you don't wanna get on the perma nono list for committing war crimes 5 separate times do you?");
      }
      if (userData[msg.author.id].commandsSinceInt > 12) { 
        prefs.noNoList.push(msg.author.id);
        if (!userData[msg.author.id].nonoListCount) userData[msg.author.id].nonoListCount = 0;
        userData[msg.author.id].nonoListCount++;
        if (userData[msg.author.id].nonoListCount >= 5) {
          prefs.permaNonoList.push(prefs.noNoList.splice(prefs.noNoList.length - 1, 1)[0])
          userData[msg.author.id].nonoListCount = 0;
          userData[msg.author.id].messagesSent = 0;
          userData[msg.author.id].gibbyCommands = 0;
          userData[msg.author.id].memesSubmitted = 0;
          return fs.writeFile("prefs.json", JSON.stringify(prefs, null, 2), () => msg.reply(`okay <@${msg.author.id}> is now on the ***Permanent No No List.***`))

        }
        fs.writeFile("prefs.json", JSON.stringify(prefs, null, 2), () => msg.reply(`okay <@${msg.author.id}> is now on the No No List.`).then(() => msg.author.send("**You have committed war crimes upon the land of Gibby**\n in order to be forgiven, you must recite this prayer to everyone in #general:\n*i was wrong, i am a fool, all hail gibby, he is our savior, the ultimate gibby, please forgive my war crimes*")))
        return msg.reply("You've exceeded the rate limit for gibby commands of 12 commands/min (1 command every 5 secs), you've been placed on the nono list and have been deducted 24 gibby commands (48xp).")
      }
      messageBatchTotal++;
    }
    if (sleep.isSleeping && msg.channel.name !== 'gibby-test' && !prefs.battleMode) return msg.channel.send('💤');
    if ((msg.channel.name === 'trading-bot' || msg.channel.name === 'gibby-test') && /trading-post/i.test(msg.toString())) {
      const { handleTradingPostCommand } = require('./trading-post');
      return handleTradingPostCommand(msg, client);
    }
    if (/chat/i.test(msg.toString())) {
      let lineBegin = msg.toString().indexOf('chat') + 4;
      if (lineBegin < 0) return msg.reply('pls use `gibby chat` before your message to chat with me')
      let formData = new FormData();
      formData.append('question', msg.toString().slice(lineBegin).trim())
      // console.log(formData);
      return fetch('https://boredhumans.com/process_chat.php', { method: 'post', body: formData }).then(response => response.text()).then(data => {
        let textStart = data.indexOf("<class=\"answer\">") + 16;
        let textEnd = data.indexOf("</p>");
        let returnMsg = data.slice(textStart, textEnd);
        returnMsg = returnMsg.split('<br>').join('\n').split('<b>').join('**').split('</b>').join('**').split('<em>').join('*').split('</em>').join('*');
        if (returnMsg.length > 1800) {
          returnMsg = returnMsg.slice(0,1800) + '...';
          // console.log(`New msg length: ${returnMsg.length}`)
        }
        return msg.reply(returnMsg);
      }).catch(err => {
        return console.error(err);
      })
    }
    if (/praise/i.test(msg.toString())) msg.react('✨')
    if (/nono/ig.test(msg.toString()) && /list/ig.test(msg.toString()) && msg.member.isAdmin()) {
      if (msg.mentions.users.size > 0) {
        prefs.noNoList.push(msg.mentions.users.first().id);
        if (!userData[msg.mentions.users.first().id].nonoListCount) userData[msg.mentions.users.first().id].nonoListCount = 0;
        userData[msg.mentions.users.first().id].nonoListCount++;
        if (userData[msg.mentions.users.first().id].nonoListCount >= 5) {
          prefs.permaNonoList.push(prefs.noNoList.splice(prefs.noNoList.length - 1, 1)[0])
          userData[msg.mentions.users.first().id].nonoListCount = 0;
          userData[msg.mentions.users.first().id].messagesSent = 0;
          userData[msg.mentions.users.first().id].gibbyCommands = 0;
          userData[msg.mentions.users.first().id].memesSubmitted = 0;
          return fs.writeFile("prefs.json", JSON.stringify(prefs, null, 2), () => msg.reply(`okay <@${msg.mentions.users.first().id}> is now on the ***Permanent No No List.***`))
        }
        return fs.writeFile("prefs.json", JSON.stringify(prefs, null, 2), () => msg.reply(`okay <@${msg.mentions.users.first().id}> is now on the No No List.`).then(() => msg.mentions.users.first().send("**You have committed war crimes upon the land of Gibby**\n in order to be forgiven, you must recite this prayer to everyone in #general:\n*i was wrong, i am a fool, all hail gibby, he is our savior, the ultimate gibby, please forgive my war crimes*")))
      }
    }
    if (/preferences/i.test(msg.toString()) && msg.member.isAdmin()) {
      if (/battleMode/i.test(msg.toString())) {
        prefs.battleMode = !prefs.battleMode;
	return fs.writeFile("prefs.json", JSON.stringify(prefs, null, 2), () => msg.reply(`Okay battle mode is now ${prefs.battleMode ? 'ACTIVATED' : 'turned off'}`))
      }
      if (/awakeMessage/i.test(msg.toString())) {
        prefs.awakeMessage = msg.toString().slice(msg.toString().indexOf('awakeMessage') + 12);
        return fs.writeFile("prefs.json", JSON.stringify(prefs, null, 2), () => msg.reply("Preferences saved."))
      }
      if (/callouts/i.test(msg.toString())) {
        prefs.callouts = !prefs.callouts
        return fs.writeFile("prefs.json", JSON.stringify(prefs, null, 2), () => msg.reply(`Preferences saved. Callouts are now ${prefs.callouts ? 'on' : 'off'}`))
      }
      if (/addQuote/i.test(msg.toString())) {
        let newQuote = msg.toString().slice(msg.toString().indexOf('addQuote') + 8).trim();
        quotes.push(newQuote.trim())
        return fs.writeFile("quotes.json", JSON.stringify(quotes, null, 2), () => msg.reply(`okay I'll remember your quote "${newQuote}"`))
      }
      if (/mainChannel/i.test(msg.toString())) {
        let newChannel = msg.toString().slice(msg.toString().indexOf('mainChannel') + 11)
        prefs.mainChannel = newChannel.trim();
        return fs.writeFile("prefs.json", JSON.stringify(prefs, null, 2), () => msg.reply(`Preferences saved. Main channel is now #${prefs.mainChannel}`))
      }
      if (/addMagic8Ball/i.test(msg.toString())) {
        let newQuote = msg.toString().slice(msg.toString().indexOf('addQuote') + 8);
        quotes.push(newQuote.trim())
        return fs.writeFile("quotes.json", JSON.stringify(quotes, null, 2), () => msg.reply(`okay I'll remember your quote "${newQuote}"`))
      }
      if (/testMode/i.test(msg.toString())) {
        prefs.testMode = !prefs.testMode;
        return fs.writeFile("prefs.json", JSON.stringify(prefs, null, 2), () => msg.reply(`Preferences saved. Test Mode is now ${prefs.testMode ? 'on' : 'off'}`))
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
        if (msg.attachments.array().length === 0 && !/(https:\/\/(www.)?youtube)|(https:\/\/(www.)?youtu.be)/ig.test(msg.toString())) {
          return msg.channel.messages.fetch({ limit: 10 }).then(messages => {
            let prevMessage = messages.filter(m => m.attachments.array().length > 0).array()[0];
            if (!prevMessage) {
              console.log
              return msg.reply("you need to include a meme for me to save tho")
            }
            return UTIL.saveMeme(prevMessage, memes, msg, userData);
          }).catch(err => {
            console.error(err);
            console.error("couldn't get message")
            return msg.reply("i couldn't grab your last message, sorry. try again later")
          })
        }
        return UTIL.saveMeme(msg, memes, null, userData);
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
    if (/(covid cases)|(scare me)/i.test(msg.toString())) {
      return fetch('https://www.rit.edu/ready/dashboard')
        .then((response) => response.text())
        .then((doc) => {
          const cheerio = require('cheerio');
          const $ = cheerio.load(doc);
          let cases = $('.card-header.position-relative.font-weight-normal');
          let covidLevel = $(
            'a',
            '.d-block.d-md-inline-block.bg-black.py-2.px-3.my-md-n2.mx-n2.mx-md-0.text-white.font-weight-bold'
          )[0].children[0].data.trim();
          let dataDate = $('strong', 'p:contains("Last updated:")')
          let lastUpdatedOn = moment(dataDate[0].children[0].data, 'dddd, MMMM DD, YYYY').format('MM-DD-YYYY');
          let timeSpan = $('p:contains("New Positive Cases From Past")');
          let timeSpanNum = parseInt(timeSpan[0].children[0].data.replace(/[^0-9\.]/g, ''), 10);
          let covidEmbed = new Discord.MessageEmbed().setColor("#f5a142").setTitle('RIT COVID-19 Dashboard').setDescription(`Since August 19th\nLast Updated ${lastUpdatedOn}`).addFields(
            {
              name: 'RIT Covid Level',
              value: covidLevel
            },
            {
              name: "From the Past 14 Days:",
              value: 'New Cases'
            },
            {
              name: 'Students',
              value: cases[0].children[0].data.trim(),
              inline: true
            },
            {
              name: 'Staff',
              value: cases[1].children[0].data.trim(),
              inline: true
            },
            {
              name: "Since January 25th",
              value: 'Total Cases'
            },
            {
              name: 'Students',
              value: cases[2].children[0].data.trim(),
              inline: true
            },
            {
              name: 'Staff',
              value: cases[3].children[0].data.trim(),
              inline: true
            }).setTimestamp();
          return msg.channel.send(covidEmbed);
        });
    }
    if (/covid/i.test(msg.toString())) {
      return msg.channel.send('Please remember to social distance and wear masks!')
    }
    if (/rap for me/i.test(msg.toString())) {
      msg.reply("Okay, give me a second to get set up...")
      return fetch('http://deepbeat.org/deepbeat.fcgi?l=en&nn=false&k=&m=multi&q=&q=&q=&q=&q=&q=&q=&q=').then(response => response.json()).then(data => {
        msg.channel.send(data.rhymes.map(r => r.line).join('\n') + '\n*drops the mic*')
      })
    }
    if (/uptime/i.test(msg.toString())) {
      let formData = new FormData();
      formData.append('api_key', process.env.UPTIME_API_KEY);
      formData.append('logs', '1');
      return fetch(`https://api.uptimerobot.com/v2/getMonitors`, { method: 'post', body: formData }).then(response => response.json()).then(data => {
        msg.channel.send(`I've been up for ${data.monitors[0].logs.filter(l => l.type === 2)[0].duration / 3600} hours`)
      }).catch(err => {
        console.error(err)
        return msg.reply('there was an issue retrieving the data, sorry...')
       })
    }
    if (/magic 8 ball/i.test(msg.toString())) {
      return msg.reply(magic8ball[Math.floor(Math.random() * magic8ball.length)])
    }
    if (/roll [0-9]{1,2}d[0-9]{1,3}/i.test(msg.toString())) {
      let dieIdentifierIndex = msg.toString().search(/[0-9]{1,3}d[0-9]{1,3}/gi);
      let dieString = msg.toString().slice(dieIdentifierIndex);
      dIndex = dieString.indexOf('d');
      let numDie = parseInt(dieString.slice(0, dIndex));
      let sideNum = parseInt(dieString.slice(dIndex + 1, Math.min(dIndex + 4, dieString.length)));
      msg.channel.send(`okay I'm rolling ${numDie}d${sideNum}`);
      let rolls = [];
      for (let i = 0; i < numDie; i++) {
        rolls[i] = Math.floor(Math.random() * sideNum) + 1;
      }
      return msg.reply(`you rolled ${rolls.join(', ')}`)
    }
    if (/(im hungry)|(i\x27m hungry)/i.test(msg.toString())) {
      // if (!msg.member.isAdmin() && msg.channel.name !== 'gibby-test') return msg.reply("the Dining Locations feature is currently under maintenence, sorry for the inconveinience")
      if (Math.random() < 0.01) return msg.reply("Hi hungry, I'm Gibby");
      return getDiningLocationsEmbed(msg).then(embed => msg.channel.send(embed), err => console.log(err));
    }
    if (/draw/i.test(msg.toString())) {
      return fetch('https://thisartworkdoesnotexist.com/').then(response => response.arrayBuffer()).then(arrayBuffer => msg.reply('Okay I came up with this...', {
        files: [arrayBufferToBuffer(arrayBuffer)]
      }));
    }
    // if (msg.channel.name === "poker") {
    //   if (/join/i.test(msg.toString())) return Poker.joinGame(msg);
    //   if (/leave/i.test(msg.toString())) return Poker.leaveGame(msg);
    // }
    if (/fall/i.test(msg.toString())) {
      return msg.channel.send({
        files: ['./res/fall.gif']
      })
    }
    if (/(title ix violation)|(title 9 violation)/gi.test(msg.toString())) {
      return msg.reply("I'm sorry i'll try to do better in the future");
    }
    if (/gimme my stats/i.test(msg.toString())) {
      if (!userData[msg.author.id]) return msg.reply("Sorry looks like I don't have any of your data");
      let statsEmbed = new Discord.MessageEmbed().setTitle(`${msg.member.displayName} Stats`);
      statsEmbed.addField("Total Messages", userData[msg.author.id].messagesSent || 0);
      statsEmbed.addField("Gibby Commands", userData[msg.author.id].gibbyCommands || 0);
      statsEmbed.addField("Memes Submitted", userData[msg.author.id].memesSubmitted || 0);
      statsEmbed.addField("XP", getUserXp(userData[msg.author.id]));
      userData[msg.author.id].gibbyCommands--;
      return msg.reply(statsEmbed);
    }
    if (/leaderboard/i.test(msg.toString())) {
      let sortedUsers = Object.keys(userData).map(id => ({ ...userData[id], id })).map(u => ({ ...u, xp: getUserXp(u) })).sort((a, b) => b.xp - a.xp);
      let leaderEmbed = new Discord.MessageEmbed().setTitle("Gibby XP Leaderboard").setColor("#f5a142").addField('1) Gibby', '♾️');
      sortedUsers.slice(0,5).forEach((user, i) => {
        leaderEmbed.addField(`${i + 2}) ${msg.guild.members.cache.get(user.id) ? msg.guild.members.cache.get(user.id).displayName : '[CACHE_ERROR]'}`, user.xp);
      })
      userData[msg.author.id].gibbyCommands--;
      return msg.channel.send(leaderEmbed);
    }
    if (/store/i.test(msg.toString())) {
      return msg.reply('here you go... https://shop.spreadshirt.com/the-gibby-bot');
    }
    if (/sendMessage/.test(msg.toString()) && msg.member.roles.cache.get('744719819567267851') && msg.channel.name === 'gibby-test') {
      return client.channels.cache.find(channel => channel.name === 'announcements').send(`@everyone ${msg.toString().slice(msg.toString().indexOf('sendMessage') + 12)}`);
    }
    if (/how horny is/i.test(msg.toString())) {
      let username = msg.toString().slice(msg.toString().search(/how horny is/i) + 13);
      if (username.toLowerCase() === 'gibby') return msg.reply('i shall not divulge that information...');
      username = username.replace(/[._\?\-\!]/g,'');
      username = username.toLowerCase();
      username = `${username.charAt(0).toUpperCase()}${username.slice(1)}`;
      let formData = new FormData();
      formData.append('u', username)
      return fetch('https://en.shindanmaker.com/992894', {
        method: 'post',
        body: formData
      })
      .then((response) => response.text(), console.error)
      .then((doc) => {
        const cheerio = require('cheerio');
        const $ = cheerio.load(doc);
        let results = $('div', '.result2');
        return msg.reply(`${username}${results[0].children[2].data}`)
      });
    }
    if (/server stats/i.test(msg.toString())) {
      let statsEmbed = new Discord.MessageEmbed().setTitle("Gibby Server Stats").setDescription(`Last Updated ${new Date(stats.lastUpdatedAt).toLocaleString('en-US', { timeZone: 'EST' })}`);
      statsEmbed.addField('Total XP', stats.totalXp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), false);
      statsEmbed.addField('Total Messages Sent', stats.totalMessages.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), false);
      statsEmbed.addField('Total Gibby Commands', stats.totalGibbyCommands.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), false); 
      statsEmbed.addField('Total Memes', stats.totalMemes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), false);
      return msg.channel.send(statsEmbed);
    }
    if (/help/i.test(msg.toString())) {
      return msg.channel.send(helpEmbed);
    }
    let pog = msg.guild.emojis.cache.find(e => e.name.toLowerCase() === "pogey");
    console.log(pog.toString())
//    return prefs.callouts ? msg.reply('I hear your call...') : msg.channel.send(`I heard my store has stickers now... that's kind of ${pog || 'poggers'}`)
    return;
  }

  if (messageBatchTotal >= MESSAGE_BATCH_SIZE) {
    fs.writeFile("./data/user-data.json", JSON.stringify(userData, null, 2), (err) => err && console.error(err));
    updateStats();
  }
})

const getUserXp = (user) => (user.messagesSent || 0) + (user.gibbyCommands || 0) * 2 + (user.memesSubmitted || 0) * 10;

client.login(process.env.TOKEN);

process.once('SIGTERM', () => {
  fs.writeFileSync("./data/user-data.json", JSON.stringify(userData, null, 2), console.error);
  updateStats();
  process.exit(0);
})
