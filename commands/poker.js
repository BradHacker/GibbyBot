const fs = require('fs')
const Discord = require('discord.js');
const Hand = require('pokersolver').Hand;

const States = {
  Idle: "idle",
  InProgress: "in-progress"
}

const getPokerData = () => JSON.parse(fs.readFileSync("./data/poker-data.json", "utf-8"));
const savePokerData = (pd, callback=null) => fs.writeFile("./data/poker-data.json", JSON.stringify(pd, null, 2), (err) => err ? console.error(err) : callback ? callback() : undefined);

const generatePlayerEmbed = () => {
  let pd = getPokerData();
  return new Discord.MessageEmbed().setTitle("Gibby Hold'Em").addFields(
    {
      name: "Max Players",
      value: pd.maxPlayers
    },
    {
      name: "Players",
      value: pd.players.map(p => p.name).join(", ") || "Nobody has joined yet"
    })
}

const joinGame = (msg) => {
  const pd = getPokerData();
  if (pd.state !== States.Idle && pd.players.length < pd.maxPlayers) return;
  if (pd.players.indexOf(msg.author.id) === -1) {
    pd.players.push({
      id: msg.author.id,
      name: msg.member.displayName.split("|")[0].trim()
    });
    return msg.reply("okay, you're in.").then(() => {
      savePokerData(pd, () => msg.channel.send(generatePlayerEmbed()));
    }, (err) => console.error(err));
  }
}

const leaveGame = (msg) => {
  const pd = getPokerData();
  if (pd.state !== States.Idle) return;
  let playerIndex = pd.players.map(p => p.id).indexOf(msg.author.id);
  if (playerIndex >= 0) {
    pd.players.splice(playerIndex, 1);
    return msg.reply("okay, you've left the game.").then(() => {
      savePokerData(pd, () => msg.channel.send(generatePlayerEmbed()));
    }, (err) => console.error(err));
  }
}

const startGame = (msg) => {
  const pd = getPokerData();
  if (pd.state !== States.Idle) return;
  if (!pd.players.map(p => p.id).includes(msg.author.id)) return;
  
}

module.exports = {
  joinGame,
  leaveGame
}