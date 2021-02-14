import { readFileSync, writeFile } from 'fs';
import { Logger } from './logger';
import { Preferences } from './preferences';
import { AvailableCommand } from './types';

export class Utility {
  static stripMessage(message: string, ...toRemove: RegExp[]) : string {
    let newMessage = `${message.replace(Preferences.botRegex, '')}`;
    for (let regex of toRemove) {
      newMessage = newMessage.replace(regex, '');
    }
    return newMessage.trim();
  }

  static getRegexForCommand(command: number, availableCommands: AvailableCommand[]) : RegExp | null {
    for (let c of availableCommands) {
      if (c.command === command) {
        return c.regex;
      }
    }
    return null;
  }

  static loadDataFile(path: string): any {
    return JSON.parse(readFileSync(path, { encoding: 'utf8'}));
  }
  static saveDataFile(path: string, data: any): void {
    writeFile(path, JSON.stringify(data, null, 2), () => Logger.info(`${path} data file saved`))
  }
}