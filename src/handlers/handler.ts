import { Message } from 'discord.js';
import { injectable } from 'inversify';
import { AvailableCommand } from '../types';
import { Utility } from '../utility';

@injectable()
export class Handler {
  public handlerRegex: RegExp;
  public availableCommands: AvailableCommand[];

  constructor(handlerRegex: RegExp) {
    this.handlerRegex = handlerRegex;
  }

  public canHandle(message: Message): boolean {
    for (let availableCommand of this.availableCommands) {
      if (availableCommand.regex.test(message.toString())) return true;
    }
    return false;
  }

  public handle(message: Message): Promise<Message | Message[]> {
    for (let availableCommand of this.availableCommands) {
      if (availableCommand.regex.test(message.toString())) {
        return availableCommand.exec(message);
      }
    }
    return Promise.reject();
  }

  public stripMessage(message: Message, command: number) {
    return Utility.stripMessage(
      message.toString(),
      this.handlerRegex,
      Utility.getRegexForCommand(command, this.availableCommands),
    );
  }
}
