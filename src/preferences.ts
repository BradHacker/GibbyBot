import { Logger } from './logger';
import { Utility } from './utility';

export class Preferences {
  static botRegex: RegExp = /guppy/i;
  static battleMode: boolean = false;
  static awakeMessage: string = 'Good morning gamers!';
  static mainChannel: string = 'general';
  static testMode: boolean = false;
  static testChannel: string = 'guppy-test';

  static messageBatchSize: number = 3;

  public static loadPreferences(): void {
    let preferences = Utility.loadDataFile('new-data/preferences.json');
    for (let key of Object.keys(preferences)) {
      if (Preferences[key] instanceof RegExp) {
        Preferences[key] = new RegExp(preferences[key], 'i');
      } else {
        Preferences[key] = preferences[key];
      }
    }
    Logger.info('Preferences loaded');
  }

  public static savePreferences(): void {
    Utility.saveDataFile('new-data/preferences.json', {
      botRegex: `${Preferences.botRegex.source}`,
      battleMode: Preferences.battleMode,
      awakeMessage: Preferences.awakeMessage,
      mainChannel: Preferences.mainChannel,
      messageBatchSize: Preferences.messageBatchSize,
      testMode: Preferences.testMode,
      testChannel: Preferences.testChannel,
    });
  }
}
