import { Message } from 'discord.js';
import { injectable } from 'inversify';
import { AvailableHandler, Handler } from '../types';

@injectable()
export class Responder {
  public availableHandlers: AvailableHandler[];

  public canHandle(message: Message): boolean {
    for (let availableHandler of this.availableHandlers) {
      if (availableHandler.regex.test(message.toString())) return true;
    }
    return false;
  }

  public handle(message: Message): Promise<Message | Message[]> {
    return this.getHandler(message) != null
      ? this.getHandler(message).handle(message)
      : message.reply("Sorry, I can't seem to figure out how to handle that command. I'm still learning :)");
  }

  public getHandler(message: Message): Handler | null {
    for (let availableHandler of this.availableHandlers) {
      if (availableHandler.regex.test(message.toString())) {
        return availableHandler.handler;
      }
    }
    return null;
  }
}
