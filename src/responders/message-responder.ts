import { inject, injectable } from 'inversify';
import { CommandType, TYPES } from '../types';
import { AdminResponder } from './admin-responder';
import { Message } from 'discord.js';
import { Preferences } from '../preferences';
import { FunResponder } from './fun-responder';
import { DataStore } from '../data-store';
import { Utility } from '../utility';
import { Logger } from '../logger';

const NONO_LIST_PRAYER =
  '*i was wrong, i am a fool, all hail gibby, he is our savior, the ultimate gibby, please forgive my war crimes*';

@injectable()
export class MessageResponder {
  private adminResponder: AdminResponder;
  private funResponder: FunResponder;

  constructor(
    @inject(TYPES.AdminResponder) adminResponder: AdminResponder,
    @inject(TYPES.FunResponder) funResponder: FunResponder,
  ) {
    this.adminResponder = adminResponder;
    this.funResponder = funResponder;
  }

  handle(message: Message): Promise<Message | Message[]> {
    // Track user message counts
    if (!Utility.onNonoList(message.author)) {
      DataStore.incrementUserMessages(message);
    } else {
      // Remove user from nono list if they recite the prayer
      if (message.toString() === NONO_LIST_PRAYER) {
        // TODO: Take user off of nono list
        message.react('✨');
        return message.reply('I forgive you my child, take my blessing and go in peace.');
      }
    }

    // ignore anybody not talking to gibby
    if (!Preferences.botRegex.test(message.toString())) return Promise.reject();

    if (Utility.onNonoList(message.author)) {
      return message.reply(
        `sorry bud, you're on the nono list ${message.client.emojis.cache.find((emoji) => emoji.name === 'gibby')}`,
      );
    }

    // anyone who's an admin, let the admin commands section handle them
    if (this.adminResponder.isUserAdmin(message.member)) {
      // let the admin handler attempt first
      if (this.adminResponder.canHandle(message)) {
        DataStore.incrementUserCommands(message, CommandType.ADMIN);
        return this.adminResponder.handle(message);
      }
    }
    if (this.funResponder.canHandle(message)) {
      DataStore.incrementUserCommands(message, CommandType.FUN);
      return this.funResponder.handle(message);
    }

    return message.reply('Hey');
  }
}
