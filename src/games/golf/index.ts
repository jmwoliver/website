import { GolfGame } from "./game";
import type { GameModule } from "../runtime/types";

export const createGame: GameModule["createGame"] = (context) => new GolfGame(context);
