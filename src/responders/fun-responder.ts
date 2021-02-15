import { injectable } from 'inversify';
import { QuotesHandler } from '../handlers/quotes-handler';
import { Responder } from './responder';
import { MiscHandler } from '../handlers/misc-handler';

@injectable()
export class FunResponder extends Responder {
  constructor() {
    super();
    this.availableHandlers = [
      {
        regex: /quote/i,
        handler: new QuotesHandler(/quote/i),
      },
      {
        regex: /(praise)/i,
        handler: new MiscHandler(/(praise)/i),
      },
    ];
  }
}
