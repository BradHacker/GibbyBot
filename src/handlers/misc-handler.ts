import { injectable } from 'inversify';
import { Message, MessageReaction } from 'discord.js';
import { DataStore } from '../data-store';
import { Handler } from './handler';

enum Commands {
  PRAISE,
}

@injectable()
export class MiscHandler extends Handler {
  constructor(handlerRegex: RegExp) {
    super(handlerRegex);
    this.availableCommands = [
      {
        command: Commands.PRAISE,
        regex: /praise/i,
        exec: this.handlePraise.bind(this),
      },
    ];
  }

  handlePraise(message: Message): Promise<MessageReaction> {
    return message.react('✨');
  }
}
