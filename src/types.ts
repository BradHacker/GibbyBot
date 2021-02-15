import { Message, Snowflake, User } from 'discord.js';
import { EnumMember, EnumType } from 'typescript';

export const TYPES = {
  Bot: Symbol('Bot'),
  Client: Symbol('Client'),
  Token: Symbol('Token'),
  MessageResponder: Symbol('MessageResponder'),
  AdminResponder: Symbol('AdminResponder'),
  FunResponder: Symbol('FunResponder'),
};

export interface Responder {
  availableHandlers: AvailableHandler[];
  canHandle(msg: Message): boolean;
  handle(msg: Message): Promise<Message | Message[]>;
  getHandler(msg: Message): Handler | null;
}

export interface Handler {
  availableCommands: AvailableCommand[];
  canHandle(msg: Message): boolean;
  handle(msg: Message): Promise<Message | Message[]>;
}

export enum AdminHandler {
  PREFERENCES,
}

export interface AvailableHandler {
  regex: RegExp;
  handler: Handler;
}

export interface AvailableCommand {
  command: number;
  regex: RegExp;
  exec(msg: Message): Promise<Message | Message[]>;
}

export type Quote = string;
export type Magic8BallResponse = string;

export interface Meme {
  url: string;
  caption?: string;
  submittedAt?: Date;
  submittedBy?: Snowflake | string;
}

export interface UserDataMap {
  [key: string]: UserData;
}

export interface MessageStatsMap {
  channel: Snowflake;
  amount: number;
}

export enum CommandType {
  ADMIN,
  FUN,
  INFO,
}
export interface CommandStatsMap {
  channel: Snowflake;
  commands: {
    type: CommandType;
    amount: number;
  }[];
}

export interface UserData {
  messagesSent: MessageStatsMap[];
  gibbyCommands: CommandStatsMap[];
  commandsIntStart: number;
  commandsSinceInt: number;
  nonoListCount: number;
}
