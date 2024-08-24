import type { Card } from "@/core";
import type { Game, Player } from "@/types";
import { getElement } from "@/utils/getElement";
import { renderCard } from "./card";
import { cardDropped } from "./events";

export function renderMyCards(game: Game, player: Player) {
  setTimeout(() => {
    window.addEventListener("cardDropped", (event) => {
      if (event.detail.player === player) {
        redraw(game, player);
      }
    });
  });
  return `<div id="mc">${render(game, player)}</div>`;
}

function render(game: Game, player: Player) {
  return player.cards
    .map((card) => renderPlayerCard(game, player, card))
    .join(" ");
}

function renderPlayerCard(game: Game, player: Player, card: Card) {
  const id = `mc-${card.cardNumber}-${card.suit}`;
  setTimeout(() => {
    getElement(id).addEventListener("dragend", (event) => {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      if (event.clientY < rect.top) {
        dispatchEvent(cardDropped(game, player, card));
      } else if (event.clientY > rect.top + rect.height) {
        dispatchEvent(cardDropped(game, player, card));
      }
    });
  });
  return `<button id="${id}" draggable="true">${renderCard(card)}</button>`;
}

function redraw(game: Game, player: Player) {
  getElement("mc").innerHTML = render(game, player);
}
