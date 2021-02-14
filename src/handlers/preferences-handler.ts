import { injectable } from 'inversify';
import { Message } from 'discord.js';
import { Preferences } from '../preferences';
import { DataStore } from '../data-store';
import { Handler } from './handler';

enum Commands {
  BATTLE_MODE,
  AWAKE_MESSAGE,
  CALLOUTS,
  ADD_QUOTE,
  MAIN_CHANNEL,
  ADD_MAGIC_8_BALL,
  TEST_MODE,
}

@injectable()
export class PreferencesHandler extends Handler {
  constructor(handlerRegex: RegExp) {
    super(handlerRegex);
    this.availableCommands = [
      {
        command: Commands.BATTLE_MODE,
        regex: /battleMode/,
        exec: this.handleBattleMode.bind(this),
      },
      {
        command: Commands.AWAKE_MESSAGE,
        regex: /awakeMessage/,
        exec: this.handleAwakeMessage.bind(this),
      },
      {
        command: Commands.ADD_QUOTE,
        regex: /addQuote/,
        exec: this.handleAddQuote.bind(this),
      },
      {
        command: Commands.MAIN_CHANNEL,
        regex: /mainChannel/,
        exec: this.handleMainChannel.bind(this),
      },
      {
        command: Commands.ADD_MAGIC_8_BALL,
        regex: /addMagic8Ball/,
        exec: this.handleAddMagic8Ball.bind(this),
      },
    ];
  }

  handleBattleMode(message: Message): Promise<Message | Message[]> {
    Preferences.battleMode = !Preferences.battleMode;
    Preferences.savePreferences();
    return message.reply(`Okay battle mode is now ${Preferences.battleMode ? 'ACTIVATED' : 'turned off'}`);
  }

  handleAwakeMessage(message: Message): Promise<Message | Message[]> {
    const newAwakeMessage = this.stripMessage(message, Commands.AWAKE_MESSAGE);
    Preferences.awakeMessage = newAwakeMessage;
    Preferences.savePreferences();
    return message.reply(`Okay, awake message is now "${newAwakeMessage}"`);
  }

  handleAddQuote(message: Message): Promise<Message | Message[]> {
    const newQuote = this.stripMessage(message, Commands.ADD_QUOTE);
    DataStore.quotes.push(newQuote);
    DataStore.saveQuotes();
    return message.reply(`Okay, added the quote "${newQuote}"`);
  }

  handleMainChannel(message: Message): Promise<Message | Message[]> {
    const newMainChannel = this.stripMessage(message, Commands.MAIN_CHANNEL);
    Preferences.mainChannel = newMainChannel;
    Preferences.savePreferences();
    return message.reply(`Okay, the main channel is now "${newMainChannel}"`);
  }

  handleAddMagic8Ball(message: Message): Promise<Message | Message[]> {
    const newMagic8Ball = this.stripMessage(message, Commands.ADD_MAGIC_8_BALL);
    DataStore.magic8ballResponses.push(newMagic8Ball);
    DataStore.saveMagic8Ball();
    return message.reply(`Okay, added the magic 8 ball response "${newMagic8Ball}"`);
  }
}
