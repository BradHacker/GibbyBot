import { Client, Message } from 'discord.js';
import { inject, injectable } from 'inversify';
import { TYPES } from './types';
import { MessageResponder } from './responders/message-responder';
import { Preferences } from './preferences';
import { Logger } from './logger';
import { DataStore } from './data-store';

@injectable()
export class Bot {
  private client: Client;
  private readonly token: string;
  private messageResponder: MessageResponder;

  constructor(
    @inject(TYPES.Client) client: Client,
    @inject(TYPES.Token) token: string,
    @inject(TYPES.MessageResponder) messageResponder: MessageResponder,
  ) {
    Preferences.loadPreferences();
    DataStore.loadDataStore();
    this.client = client;
    this.token = token;
    this.messageResponder = messageResponder;
  }

  public listen(): Promise<string> {
    this.client.on('message', (msg: Message) => {
      // ignore responding to bot messages
      if (msg.author.bot) return;

      this.messageResponder.handle(msg).catch((error) => {
        Logger.error("couldn't send message " + error);
      });
    });
    return this.client.login(this.token);
  }
}
