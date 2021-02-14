import { GuildMember, Message } from 'discord.js';
import { injectable } from 'inversify';
import { AvailableHandler, Handler } from '../types';
import { PreferencesHandler } from '../handlers/preferences-handler';
import { Responder } from './responder';

@injectable()
export class AdminResponder extends Responder {
  private adminRoles: string[] = ['Admin'];
  public availableHandlers: AvailableHandler[];

  constructor() {
    super();
    this.availableHandlers = [
      {
        regex: /preferences/i,
        handler: new PreferencesHandler(/preferences/i),
      },
    ];
  }

  public isUserAdmin(member: GuildMember) {
    return member.roles.cache.find((r) => this.adminRoles.find((ar) => ar === r.name) !== undefined);
  }
}
