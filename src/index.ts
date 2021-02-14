
import path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), 'src/guppy.env') });
import container from './inversify.config';
import { TYPES } from './types';
import { Bot } from './bot';
import { Logger } from './logger';

let bot = container.get<Bot>(TYPES.Bot);

bot.listen().then(() => {
  Logger.info('Logged in')
}).catch(error => {
  Logger.error('couldn\'t log in', `${error}`)
})