import { Snowflake, Util, User, Message } from 'discord.js';
import { Quote, Meme, Magic8BallResponse, UserData, UserDataMap, CommandType } from './types';
import { Utility } from './utility';
import { Logger } from './logger';
import { Preferences } from './preferences';

export class DataStore {
  public static quotes: Quote[] = [];
  public static memes: Meme[] = [];
  public static magic8ballResponses: Magic8BallResponse[] = [];
  public static nonoList: Snowflake[] = [];
  public static userData: UserDataMap = {};

  private static messagesInBatch = 0;

  public static loadDataStore() {
    DataStore.quotes = Utility.loadDataFile('new-data/quotes.json');
    DataStore.memes = Utility.loadDataFile('new-data/memes.json');
    DataStore.magic8ballResponses = Utility.loadDataFile('new-data/magic8ball.json');
    DataStore.nonoList = Utility.loadDataFile('new-data/nono-list.json');
    DataStore.userData = Utility.loadDataFile('new-data/user-data.json');
    Logger.info('DataStore loaded');
  }

  public static saveQuotes() {
    Utility.saveDataFile('new-data/quotes.json', DataStore.quotes);
  }

  public static saveMemes() {
    Utility.saveDataFile('new-data/memes.json', DataStore.memes);
  }

  public static saveMagic8Ball() {
    Utility.saveDataFile('new-data/magic8ball.json', DataStore.magic8ballResponses);
  }

  public static saveNonoList() {
    Utility.saveDataFile('new-data/nono-list.json', DataStore.nonoList);
  }

  public static saveUserData() {
    Utility.saveDataFile('new-data/user-data.json', DataStore.userData);
  }

  private static createUserIfNotExists(user: User) {
    if (this.userData[user.id] === undefined) {
      this.userData[user.id] = {
        messagesSent: [],
        gibbyCommands: [],
        commandsIntStart: 0,
        commandsSinceInt: 0,
      };
    }
  }

  private static saveIfMessageBatchIsFull() {
    this.messagesInBatch++;
    if (this.messagesInBatch >= Preferences.messageBatchSize) {
      this.saveUserData();
      this.messagesInBatch = 0;
    }
  }

  public static incrementUserMessages(message: Message) {
    this.createUserIfNotExists(message.author);
    let channelIndex = this.userData[message.author.id].messagesSent
      .map((mS) => mS.channel)
      .indexOf(message.channel.id);
    if (channelIndex == -1) {
      this.userData[message.author.id].messagesSent.push({
        channel: message.channel.id,
        amount: 1,
      });
    } else {
      this.userData[message.author.id].messagesSent[channelIndex].amount++;
    }
    this.saveIfMessageBatchIsFull();
  }

  public static incrementUserCommands(message: Message, commandType: CommandType) {
    this.createUserIfNotExists(message.author);
    let channelIndex = this.userData[message.author.id].gibbyCommands
      .map((mS) => mS.channel)
      .indexOf(message.channel.id);
    if (channelIndex == -1) {
      this.userData[message.author.id].gibbyCommands.push({
        channel: message.channel.id,
        commands: [
          {
            type: commandType,
            amount: 1,
          },
        ],
      });
    } else {
      let commandIndex = this.userData[message.author.id].gibbyCommands[channelIndex].commands
        .map((c) => c.type)
        .indexOf(commandType);
      if (commandIndex == -1) {
        this.userData[message.author.id].gibbyCommands[channelIndex].commands.push({
          type: commandType,
          amount: 1,
        });
      } else {
        this.userData[message.author.id].gibbyCommands[channelIndex].commands[commandIndex].amount++;
      }
    }
  }
}
