import type { Game, CmdResult } from "../engine";

export interface Command {
  name: string;
  aliases?: string[];
  usage: string;
  help: string;
  detail: string;
  run: (g: Game, args: string[]) => CmdResult;
}
