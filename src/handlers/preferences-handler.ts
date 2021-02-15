import { injectable } from 'inversify';
import { Message } from 'discord.js';
import { Preferences } from '../preferences';
import { DataStore } from '../data-store';
import { Handler } from './handler';
import { chdir } from 'process';

enum Commands {
  BATTLE_MODE,
  AWAKE_MESSAGE,
  CALLOUTS,
  ADD_QUOTE,
  MAIN_CHANNEL,
  ADD_MAGIC_8_BALL,
  TEST_MODE,
  TEST_CHANNEL,
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
      {
        command: Commands.TEST_MODE,
        regex: /testMode/,
        exec: this.handleTestMode.bind(this),
      },
      {
        command: Commands.TEST_CHANNEL,
        regex: /testChannel/,
        exec: this.handleTestChannel.bind(this),
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
    const channel = message.guild.channels.cache.find((ch) => ch.name === newMainChannel);
    if (channel === undefined) {
      return message.reply(`Sorry, I couldn't find the channel named "${newMainChannel}"`);
    }
    Preferences.mainChannel = newMainChannel;
    Preferences.savePreferences();
    return message.reply(`Okay, the main channel is now ${channel}`);
  }

  handleAddMagic8Ball(message: Message): Promise<Message | Message[]> {
    const newMagic8Ball = this.stripMessage(message, Commands.ADD_MAGIC_8_BALL);
    DataStore.magic8ballResponses.push(newMagic8Ball);
    DataStore.saveMagic8Ball();
    return message.reply(`Okay, added the magic 8 ball response "${newMagic8Ball}"`);
  }

  handleTestMode(message: Message): Promise<Message | Message[]> {
    Preferences.testMode = !Preferences.testMode;
    // Don't turn on test mode if our test channel doesn't exist
    if (Preferences.testMode) {
      const channel = message.guild.channels.cache.find((ch) => ch.name === Preferences.testChannel);
      if (channel === undefined)
        return message.reply(
          `I can't turn on test mode because the test channel \`${Preferences.testChannel}\` doesn't exist. You can change that with the \`preferences testChannel\` command or create a channel with that name.`,
        );
    }
    Preferences.savePreferences();
    return message.reply(`Okay test mode is now ${Preferences.testMode ? '**ON**' : '**OFF**'}`);
  }

  handleTestChannel(message: Message): Promise<Message | Message[]> {
    const newTestChannel = this.stripMessage(message, Commands.TEST_CHANNEL);
    const channel = message.guild.channels.cache.find((ch) => ch.name === newTestChannel);
    if (channel === undefined) {
      return message.reply(`Sorry, I couldn't find the channel named "${newTestChannel}"`);
    }
    Preferences.mainChannel = newTestChannel;
    Preferences.savePreferences();
    return message.reply(`Okay, the main channel is now ${channel}`);
  }
}
