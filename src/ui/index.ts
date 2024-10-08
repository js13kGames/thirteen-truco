import { getDefaultDeck, playerNames } from "@/config";
import { TrucoGame, TrucoPlayer } from "@/games/truco";
import { renderGame } from "./game";
import { renderHelp } from "./help";
import { renderSplash } from "./splash";

export function renderApp() {
  const game = createGame();
  renderHelp();
  renderSplash(game);
  renderGame(game);
}

function createGame() {
  const game = new TrucoGame(getDefaultDeck());
  game.players = playerNames.map(
    (name, index) => new TrucoPlayer(game, name, index !== 0),
  );
  return game;
}
