const Discord = require('discord.js');

const helpEmbed = new Discord.MessageEmbed()
  .setColor("#f5a142")
  .setTitle("Gibby Help")
  .setDescription("How to interact with Gibby")
  .addFields(
    { name: "dining locations/i'm hungry", value: "display all on-campus dining locations and their open/closed status"},
    { name: "covid cases", value: "get live covid data from the RIT COVID-19 Dashboard" },
    { name: "**[look at/save], meme**", value: "saves your meme to gibby's memory (can be captioned by adding \"it's titled *insert caption here*\")" },
    { name: "**gimme, meme**", value: "gives you a random meme from gibby's memory" },
    { name: "**magic 8 ball**", value: "ask gibby a question and he'll return a magic 8 ball response" },
    { name: "**inspirational, quote**", value: "gives you an AI generated inspirational quote" },
    { name: "**chat**", value: "use this to chat with gibby (ie. `gibby chat how are you feeling?`)" },
    { name: "roll xxdxxx", value: "roll up to 99 die with up to 100 sides, replace *xx* with num die to roll *xxx* with the number of sides"},
    { name: "**[thanks/thank you]**", value: "thank gibby", inline: true },
    { name: "**praise**", value: "praise gibby and he will bless you", inline: true },
    { name: "**rap for me**", value: "gibby will generate you a rap", inline: true },
    { name: "**quote**", value: "gives you a random gibby quote", inline: true },
    { name: "bucket", value: "gibby will fill your bucket", inline: true },
    { name: "**help**", value: "displays this message", inline: true }
  )
  .setTimestamp()

module.exports = helpEmbed