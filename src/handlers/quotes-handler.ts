import { injectable } from 'inversify';
import { Message } from 'discord.js';
import { Preferences } from '../preferences';
import { DataStore } from '../data-store';
import { Handler } from './handler';

enum Commands {
  GIMME,
}

@injectable()
export class QuotesHandler extends Handler {
  constructor(handlerRegex: RegExp) {
    super(handlerRegex);
    this.availableCommands = [
      {
        command: Commands.GIMME,
        regex: /gimme/i,
        exec: this.handleGimme.bind(this),
      },
    ];
  }

  handleGimme(message: Message): Promise<Message | Message[]> {
    return message.reply(DataStore.quotes[Math.floor(Math.random() * DataStore.quotes.length)]);
  }
}
