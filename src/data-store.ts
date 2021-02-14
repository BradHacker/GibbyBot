import { Util } from 'discord.js';
import { Quote, Meme, Magic8BallResponse } from './types';
import { Utility } from './utility';
import { Logger } from './logger';

export class DataStore {
  public static quotes: Quote[] = [];
  public static memes: Meme[] = [];
  public static magic8ballResponses: Magic8BallResponse[] = [];

  public static loadDataStore() {
    DataStore.quotes = Utility.loadDataFile('new-data/quotes.json');
    DataStore.memes = Utility.loadDataFile('new-data/memes.json');
    DataStore.magic8ballResponses = Utility.loadDataFile('new-data/magic8ball.json');
    Logger.info('DataStore loaded');
  }

  public static saveQuotes() {
    Utility.saveDataFile('new-data/quotes.json', DataStore.quotes);
  }

  public static saveMemes() {
    Utility.saveDataFile('new-data/memes.json', DataStore.memes);
  }

  public static saveMagic8Ball() {
    Utility.saveDataFile('new-data/magic8ball.json', DataStore.magic8ballResponses);
  }
}
