import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { AdminResponder } from './admin-responder';
import { Message } from 'discord.js';
import { Preferences } from '../preferences';
import { Logger } from '../logger';
import { FunResponder } from './fun-responder';

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
    // ignore anybody not talking to gibby
    if (!Preferences.botRegex.test(message.toString())) return Promise.reject();

    // anyone who's an admin, let the admin commands section handle them
    if (this.adminResponder.isUserAdmin(message.member)) {
      // let the admin handler attempt first
      if (this.adminResponder.canHandle(message)) return this.adminResponder.handle(message);
    }
    if (this.funResponder.canHandle(message)) return this.funResponder.handle(message);

    return message.reply('Hey');
  }
}
