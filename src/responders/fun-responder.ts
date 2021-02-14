import { Message } from 'discord.js';
import { injectable } from 'inversify';
import { AvailableHandler } from '../types';
import { QuotesHandler } from '../handlers/quotes-handler';
import { Responder } from './responder';

@injectable()
export class FunResponder extends Responder {
  constructor() {
    super();
    this.availableHandlers = [
      {
        regex: /quote/i,
        handler: new QuotesHandler(/quote/i),
      },
    ];
  }
}
