import type { Card, Deck } from "@/core";

export interface Game {
  deck: Deck;
  players: Player[];
  currentRound: Round;
}

export interface Round {
  steps: Step[];
  currentStep: Step;
  advanceStep: () => void;
}

export interface Step {
  cards: Card[];
  isDone: boolean;
  addPlayerCard: (player: Player, card: Card) => void;
}

export interface Player {
  id: number;
  name: string;
  cards: Card[];
  pickCard?: () => Card;
  dropCard: (card: Card) => void;
  receiveCards: (cards: Card[]) => void;
}
