import type { Game, StepCard } from "@/types";
import { findElement, getElement } from "@/utils/elements";
import { renderCard } from "./card";
import { renderCardBack } from "./cardBack";
import { cardPlaced } from "./events";

export function renderTableCards(game: Game) {
  setTimeout(() => {
    window.addEventListener("cardDropped", (event) => {
      // Highlight latest card
      redraw(event.detail.game);
      findElement(".ltc").addEventListener("animationend", () => {
        dispatchEvent(
          cardPlaced(event.detail.game, event.detail.player, event.detail.card),
        );
      });
    });
    window.addEventListener("roundDone", (event) => {
      // Highlight best cards
      const highlightBestCards = true;
      redraw(event.detail.game, highlightBestCards);
    });
    window.addEventListener("roundAcknowledged", (event) => {
      redraw(event.detail.game);
    });
  });
  return `<div class="t"><div id="t">${render(game)}</div></div>`;
}

function render(game: Game, highlightBestCards?: boolean) {
  return game.currentRound.steps
    .map((step, stepIndex) => {
      return `<div class="${game.currentRound.isDone ? "done" : ""}">${step.cards
        .map((stepCard, cardIndex) => {
          const isLatestCard =
            !highlightBestCards &&
            stepIndex + 1 === game.currentRound.steps.length &&
            cardIndex + 1 === game.currentRound.currentStep.cards.length;
          const isBestCard = highlightBestCards && stepCard.isBest;
          return renderTableCard(stepCard, [
            isLatestCard ? "ltc" : "",
            isBestCard ? "btc" : "",
            `ti-${stepCard.player.teamIndex}`,
          ]);
        })
        .join(" ")}</div>`;
    })
    .join("");
}

function redraw(game: Game, highlightBestCards?: boolean) {
  getElement("t").innerHTML = render(game, highlightBestCards);
}

function renderTableCard(stepCard: StepCard, classNames: string[]) {
  return `<div class="tc ${classNames.join(" ")}">
      ${stepCard.isHidden ? renderCardBack() : renderCard(stepCard.card)}
    </div>`;
}
