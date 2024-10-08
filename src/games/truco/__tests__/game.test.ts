import { Card, Deck } from "@/core";
import { type Step, type StepCard, Suit } from "@/types";
import {
  CantRaiseStakesOnCompletedRoundStepError,
  CardNotFoundError,
  GameFinishedError,
  NotYourTurnError,
  PendingStakeRaiseError,
  RoundFullError,
} from "@/utils/errors";
import { range } from "@/utils/range";
import type { SetRequired } from "type-fest";
import { describe, expect, it, vi } from "vitest";
import { TrucoGame, TrucoPlayer } from "../index";

describe("card shuffling", () => {
  it("should shuffle the deck, give 3 distinct cards to each player and set turned card and on every round", () => {
    const cardsFromLowestToHighest = [
      new Card(4, Suit.Spades),
      new Card(1, Suit.Hearts),
      new Card(1, Suit.Clubs),
      new Card(2, Suit.Hearts),
      new Card(2, Suit.Clubs),
      new Card(3, Suit.Hearts),
      new Card(3, Suit.Clubs),
    ];
    const shuffledCards = [
      new Card(4, Suit.Spades),
      new Card(3, Suit.Clubs),
      new Card(2, Suit.Clubs),
      new Card(1, Suit.Clubs),
      new Card(3, Suit.Hearts),
      new Card(2, Suit.Hearts),
      new Card(1, Suit.Hearts),
    ];
    const sorter = vi
      .fn<(cards: Card[]) => Card[]>()
      .mockImplementationOnce(() => [...shuffledCards])
      .mockImplementation(() => [...shuffledCards].reverse());
    const customDeck = new Deck(cardsFromLowestToHighest, sorter);
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    expect(game.currentRound.turnedCard).toEqual(new Card(4, Suit.Spades));
    const [player1, player2] = game.players;
    expect(player1.cards).toEqual([
      new Card(3, Suit.Clubs),
      new Card(2, Suit.Clubs),
      new Card(1, Suit.Clubs),
    ]);
    expect(player2.cards).toEqual([
      new Card(3, Suit.Hearts),
      new Card(2, Suit.Hearts),
      new Card(1, Suit.Hearts),
    ]);
    for (const index of [3, 2, 1]) {
      player1.dropCard(new Card(index, Suit.Clubs));
      player2.dropCard(new Card(index, Suit.Hearts));
      if (!game.currentRound.isDone) {
        game.currentRound.continue();
      } else {
        game.continue();
      }
    }
    // New round should shuffle again
    expect(game.currentRound.turnedCard).toEqual(new Card(1, Suit.Hearts));
    expect(player1.cards).toEqual([
      new Card(2, Suit.Hearts),
      new Card(3, Suit.Hearts),
      new Card(1, Suit.Clubs),
    ]);
    expect(player2.cards).toEqual([
      new Card(2, Suit.Clubs),
      new Card(3, Suit.Clubs),
      new Card(4, Suit.Spades),
    ]);
  });

  it("should not set mimicable cards as turned cards", () => {
    const cardsFromLowestToHighest = [
      new Card(13, Suit.Spades, true),
      new Card(4, Suit.Spades),
      new Card(1, Suit.Hearts),
      new Card(1, Suit.Clubs),
      new Card(2, Suit.Hearts),
      new Card(2, Suit.Clubs),
      new Card(3, Suit.Hearts),
      new Card(3, Suit.Clubs),
    ];
    const shuffledCards = [
      new Card(13, Suit.Spades, true),
      new Card(4, Suit.Spades),
      new Card(3, Suit.Clubs),
      new Card(2, Suit.Clubs),
      new Card(1, Suit.Clubs),
      new Card(3, Suit.Hearts),
      new Card(2, Suit.Hearts),
      new Card(1, Suit.Hearts),
    ];
    const customDeck = new Deck(cardsFromLowestToHighest, () => [
      ...shuffledCards,
    ]);
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    expect(game.currentRound.turnedCard).toEqual(new Card(4, Suit.Spades));
    expect(game.currentRound.trumpCards).toEqual([
      new Card(1, Suit.Clubs),
      new Card(1, Suit.Hearts),
    ]);
    const [player1, player2] = game.players;
    expect(player1.cards).toEqual([
      new Card(3, Suit.Clubs),
      new Card(2, Suit.Clubs),
      new Card(1, Suit.Clubs),
    ]);
    expect(player2.cards).toEqual([
      new Card(3, Suit.Hearts),
      new Card(2, Suit.Hearts),
      new Card(1, Suit.Hearts),
    ]);
  });

  it("should not set mimicable cards as trump cards", () => {
    const cardsFromLowestToHighest = [
      new Card(4, Suit.Spades),
      new Card(13, Suit.Hearts, true),
      new Card(13, Suit.Clubs, true),
      new Card(1, Suit.Hearts),
      new Card(1, Suit.Clubs),
      new Card(2, Suit.Hearts),
      new Card(2, Suit.Clubs),
      new Card(3, Suit.Hearts),
      new Card(3, Suit.Clubs),
    ];
    const shuffledCards = [
      new Card(4, Suit.Spades),
      new Card(13, Suit.Clubs, true),
      new Card(3, Suit.Clubs),
      new Card(2, Suit.Clubs),
      new Card(13, Suit.Hearts, true),
      new Card(3, Suit.Hearts),
      new Card(2, Suit.Hearts),
      new Card(1, Suit.Clubs),
      new Card(1, Suit.Hearts),
    ];
    const customDeck = new Deck(cardsFromLowestToHighest, () => [
      ...shuffledCards,
    ]);
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    expect(game.currentRound.turnedCard).toEqual(new Card(4, Suit.Spades));
    expect(game.currentRound.trumpCards).toEqual([
      new Card(1, Suit.Clubs),
      new Card(1, Suit.Hearts),
    ]);
    const [player1, player2] = game.players;
    expect(player1.cards).toEqual([
      new Card(13, Suit.Clubs, true),
      new Card(2, Suit.Clubs),
      new Card(13, Suit.Hearts, true),
    ]);
    expect(player1.displayCards).toEqual([
      new Card(3, Suit.Clubs),
      new Card(2, Suit.Clubs),
      new Card(3, Suit.Hearts),
    ]);
    expect(player2.cards).toEqual([
      new Card(2, Suit.Hearts),
      new Card(1, Suit.Clubs),
      new Card(1, Suit.Hearts),
    ]);
  });
});

describe("game playing", () => {
  it("should allow player to drop cards on the table", () => {
    const game = new TrucoGame(getDeck());
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    const [player1, player2] = game.players;
    player1.dropCard(new Card(3, Suit.Hearts));
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(3, Suit.Hearts) },
    ]);
    player2.dropCard(new Card(3, Suit.Clubs));
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(3, Suit.Hearts) },
      { card: new Card(3, Suit.Clubs) },
    ]);

    game.currentRound.continue();
    player1.dropCard(new Card(2, Suit.Hearts));
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(2, Suit.Hearts) },
    ]);
    player2.dropCard(new Card(2, Suit.Clubs));
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(2, Suit.Hearts) },
      { card: new Card(2, Suit.Clubs) },
    ]);
  });

  it("should fill rounds, steps as players drop cards", () => {
    const game = new TrucoGame(getDeck());
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    const [player1, player2] = game.players;
    expect(game.rounds).toHaveLength(1);
    expect(game.currentRound.currentPlayer).toEqual(game.players[0]);
    expect(game.currentRound.steps).toHaveLength(1);
    expect(game.currentRound.currentStep.cards).toEqual([]);
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.currentStep.isDone).toBe(false);

    player1.dropCard(new Card(3, Suit.Hearts));
    expect(game.rounds).toHaveLength(1);
    expect(game.currentRound.currentPlayer).toEqual(player2);
    expect(game.currentRound.steps).toHaveLength(1);
    expect(game.currentRound.currentStep.cards).toHaveLength(1);
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.currentStep.isDone).toBe(false);

    player2.dropCard(new Card(3, Suit.Clubs));
    expect(game.rounds).toHaveLength(1);
    expect(game.currentRound.currentPlayer).toBeNull(); // because step is done
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.steps).toHaveLength(1);
    expect(game.currentRound.currentStep.cards).toHaveLength(2);
    expect(game.currentRound.currentStep.isDone).toBe(true);

    game.currentRound.continue(); // Has to explicitly continue round
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.currentPlayer).toEqual(player1);
    expect(game.currentRound.steps).toHaveLength(2);
    expect(game.currentRound.currentStep.cards).toHaveLength(0);
    expect(game.currentRound.currentStep.isDone).toBe(false);

    player1.dropCard(new Card(2, Suit.Hearts));
    expect(game.rounds).toHaveLength(1);
    expect(game.currentRound.currentPlayer).toEqual(player2);
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.steps).toHaveLength(2);
    expect(game.currentRound.currentStep.cards).toHaveLength(1);
    expect(game.currentRound.currentStep.isDone).toBe(false);

    player2.dropCard(new Card(2, Suit.Clubs));
    expect(game.rounds).toHaveLength(1);
    expect(game.currentRound.currentPlayer).toBeNull();
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.steps).toHaveLength(2);
    expect(game.currentRound.currentStep.cards).toHaveLength(2);
    expect(game.currentRound.currentStep.isDone).toBe(true);

    game.currentRound.continue();
    expect(game.currentRound.currentPlayer).toEqual(player1);
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.steps).toHaveLength(3);
    expect(game.currentRound.currentStep.cards).toHaveLength(0);
    expect(game.currentRound.currentStep.isDone).toBe(false);

    player1.dropCard(new Card(1, Suit.Hearts));
    expect(game.rounds).toHaveLength(1);
    expect(game.currentRound.currentPlayer).toEqual(player2);
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.steps).toHaveLength(3);
    expect(game.currentRound.currentStep.cards).toHaveLength(1);
    expect(game.currentRound.currentStep.isDone).toBe(false);

    player2.dropCard(new Card(1, Suit.Clubs));
    expect(game.rounds).toHaveLength(1);
    expect(game.currentRound.currentPlayer).toBeNull();
    expect(game.currentRound.isDone).toBe(true);
    expect(game.currentRound.steps).toHaveLength(3);
    expect(game.currentRound.currentStep.cards).toHaveLength(2);
    expect(game.currentRound.currentStep.isDone).toBe(true);

    expect(() => game.currentRound.continue()).toThrowError(RoundFullError);
    game.continue();
    expect(game.players[0].cards).toHaveLength(3);
    expect(game.players[1].cards).toHaveLength(3);
    expect(game.rounds).toHaveLength(2);
    expect(game.currentRound.currentPlayer).toEqual(player2); // next
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.steps).toHaveLength(1);
    expect(game.currentRound.currentStep.cards).toHaveLength(0);
    expect(game.currentRound.currentStep.isDone).toBe(false);
  });

  it("should indicate best cards when step is done", () => {
    const bestCards = [new Card(1, Suit.Hearts), new Card(4, Suit.Hearts)];
    const filterBestCards = vi.fn().mockReturnValue(bestCards);
    const deck = getDeck();
    const game = new TrucoGame(deck, filterBestCards);
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
      new TrucoPlayer(game, "Rick"),
      new TrucoPlayer(game, "Lester"),
    ];
    const [player1, player2, player3, player4] = game.players;
    player1.dropCard(new Card(1, Suit.Hearts));
    player2.dropCard(new Card(2, Suit.Clubs), true);
    player3.dropCard(new Card(4, Suit.Hearts));
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(1, Suit.Hearts), isBest: false },
      { card: new Card(2, Suit.Clubs), isHidden: true, isBest: false },
      { card: new Card(4, Suit.Hearts), isBest: false },
    ]);

    player4.dropCard(new Card(5, Suit.Clubs));
    expect(game.currentRound.currentStep.isDone).toBe(true);
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(1, Suit.Hearts), isBest: true },
      { card: new Card(2, Suit.Clubs), isHidden: true, isBest: false },
      { card: new Card(4, Suit.Hearts), isBest: true },
      { card: new Card(5, Suit.Clubs), isBest: false },
    ]);
    expect(game.currentRound.turnedCard).toEqual(new Card(12, Suit.Spades));
    expect(game.currentRound.trumpCards).toEqual([
      new Card(1, Suit.Clubs),
      new Card(1, Suit.Hearts),
    ]);
    const trumpCardNumber = 1;
    expect(filterBestCards).toHaveBeenCalledWith(
      [
        new Card(1, Suit.Hearts),
        new Card(4, Suit.Hearts),
        new Card(5, Suit.Clubs),
      ],
      deck.cardsFromLowestToHighest,
      trumpCardNumber,
    );
  });

  it("should allow player to drop card as hidden", () => {
    const game = new TrucoGame(getDeck());
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    game.players[0].dropCard(new Card(1, Suit.Hearts), true);
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(1, Suit.Hearts), isHidden: true },
    ]);
  });

  it("should prevent player dropping multiple cards in the same round", () => {
    const game = new TrucoGame(getDeck());
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    const [player1, player2] = game.players;
    player1.dropCard(new Card(1, Suit.Hearts));
    expect(() => player1.dropCard(new Card(2, Suit.Hearts))).toThrowError(
      NotYourTurnError,
    );
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(1, Suit.Hearts) },
    ]);

    // game can continue after that
    player2.dropCard(new Card(2, Suit.Clubs));
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(1, Suit.Hearts) },
      { card: new Card(2, Suit.Clubs) },
    ]);

    game.currentRound.continue();
    player1.dropCard(new Card(2, Suit.Hearts));
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(2, Suit.Hearts) },
    ]);
  });
});

describe("raising stakes (truco)", () => {
  it("should allow raising stake and accept it before dropping the first card", () => {
    const game = new TrucoGame(getDeck());
    game.players = [
      new TrucoPlayer(game, "Player 1"),
      new TrucoPlayer(game, "Player 2"),
      new TrucoPlayer(game, "Player 3"),
      new TrucoPlayer(game, "Player 4"),
    ];
    const [player1, player2, _player3, player4] = game.players;
    expect(game.currentRound.stake).toEqual({ isAccepted: true });
    game.currentRound.raiseStake(player1);
    expect(game.currentRound.stake).toMatchObject({
      points: 3,
      raisedBy: player1,
      acceptedBy: [],
      rejectedBy: [],
      isAccepted: undefined,
    });
    for (const player of game.players) {
      // Can't drop cards or raise stake again until stake raise is accepted
      expect(() => player.dropCard(player.cards[0])).toThrowError(
        PendingStakeRaiseError,
      );
      expect(() => game.currentRound.raiseStake(player)).toThrowError(
        PendingStakeRaiseError,
      );
    }
    game.currentRound.stake.accept(player2);
    expect(game.currentRound.stake).toMatchObject({
      points: 3,
      raisedBy: player1,
      acceptedBy: [player2],
      rejectedBy: [],
      isAccepted: undefined,
    });
    for (const player of game.players) {
      // Still waiting one approval!
      expect(() => player.dropCard(player.cards[0])).toThrowError(
        PendingStakeRaiseError,
      );
      expect(() => game.currentRound.raiseStake(player)).toThrowError(
        PendingStakeRaiseError,
      );
    }
    game.currentRound.stake.accept(player4);
    for (const player of game.players) {
      player.dropCard(player.cards[0]);
    }
    expect(game.currentRound.stake).toMatchObject({
      points: 3,
      raisedBy: player1,
      acceptedBy: [player2, player4],
      rejectedBy: [],
      isAccepted: true,
    });
  });

  it("should allow rejecting the raised stake and require only one team member to reject it", () => {
    const game = new TrucoGame(getDeck());
    game.players = [
      new TrucoPlayer(game, "Player 1"),
      new TrucoPlayer(game, "Player 2"),
      new TrucoPlayer(game, "Player 3"),
      new TrucoPlayer(game, "Player 4"),
    ];
    const [player1, player2] = game.players;
    expect(game.currentRound.stake).toEqual({ isAccepted: true });
    player1.dropCard(player1.cards[0]);
    game.currentRound.raiseStake(player2);
    expect(game.currentRound.stake).toMatchObject({
      points: 3,
      raisedBy: player2,
      acceptedBy: [],
      rejectedBy: [],
      isAccepted: undefined,
    });
    game.currentRound.stake.reject(player1);
    expect(game.currentRound.stake).toMatchObject({
      points: 3,
      raisedBy: player2,
      acceptedBy: [],
      rejectedBy: [player1],
      isAccepted: false,
    });
    expect(game.currentRound.isDone).toBe(true);
    game.continue();
    for (const player of game.players) {
      expect(player.cards).toHaveLength(3);
    }
    expect(game.rounds).toHaveLength(2);
    expect(game.currentRound.currentPlayer).toEqual(player2);
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.steps).toHaveLength(1);
    expect(game.currentRound.currentStep.cards).toHaveLength(0);
    expect(game.currentRound.currentStep.isDone).toBe(false);
  });

  it("should allow raising stake and accepting it after dropping the first card", () => {
    const game = new TrucoGame(getDeck());
    game.players = [
      new TrucoPlayer(game, "Player 1"),
      new TrucoPlayer(game, "Player 2"),
    ];
    const [player1, player2] = game.players;
    expect(game.currentRound.stake).toEqual({ isAccepted: true });
    player1.dropCard(new Card(3, Suit.Hearts));
    player2.dropCard(new Card(2, Suit.Clubs));
    expect(() => game.currentRound.raiseStake(player1)).toThrowError(
      CantRaiseStakesOnCompletedRoundStepError,
    );
    game.currentRound.continue();
    player1.dropCard(player1.cards[0]);
    game.currentRound.raiseStake(player1);
    expect(() => player2.dropCard(player2.cards[0])).toThrowError(
      PendingStakeRaiseError,
    );
    game.currentRound.stake.accept(player2);
    player2.dropCard(player2.cards[0]);
  });

  it("should refuse players of the same team to accept or reject the raised stake", () => {
    const game = new TrucoGame(getDeck());
    game.players = [
      new TrucoPlayer(game, "Player 1"),
      new TrucoPlayer(game, "Player 2"),
      new TrucoPlayer(game, "Player 3"),
      new TrucoPlayer(game, "Player 4"),
    ];
    game.currentRound.raiseStake(game.players[0]);
    expect(() => game.currentRound.stake.accept(game.players[2])).toThrowError(
      NotYourTurnError,
    );
    expect(() => game.currentRound.stake.reject(game.players[2])).toThrowError(
      NotYourTurnError,
    );
  });
});

describe("score calculation", () => {
  it("should mark score for the player with 2 rounds", () => {
    const customDeck = new Deck(
      [
        new Card(1, Suit.Clubs),
        new Card(1, Suit.Hearts),
        new Card(2, Suit.Clubs),
        new Card(2, Suit.Hearts),
        new Card(3, Suit.Clubs),
        new Card(3, Suit.Hearts),
        new Card(4, Suit.Spades),
      ],
      () => [
        new Card(4, Suit.Spades),
        new Card(1, Suit.Clubs),
        new Card(2, Suit.Clubs),
        new Card(3, Suit.Clubs),
        new Card(1, Suit.Hearts),
        new Card(2, Suit.Hearts),
        new Card(3, Suit.Hearts),
      ],
    );
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Player 1"),
      new TrucoPlayer(game, "Player 2"),
    ];
    const [player1, player2] = game.players;
    expect(game.currentRound.isDone).toBe(false);
    player1.dropCard(new Card(3, Suit.Clubs)); // best
    player2.dropCard(new Card(2, Suit.Hearts));
    expect(game.currentRound.score).toBeUndefined();
    expect(game.score).toEqual([0, 0]);
    expect(game.currentRound.isDone).toBe(false);
    game.currentRound.continue();
    player1.dropCard(new Card(2, Suit.Clubs));
    player2.dropCard(new Card(1, Suit.Hearts)); // best (trump)
    expect(game.currentRound.score).toBeUndefined();
    expect(game.score).toEqual([0, 0]);
    expect(game.currentRound.isDone).toBe(false);
    game.currentRound.continue();
    player2.dropCard(new Card(3, Suit.Hearts));
    player1.dropCard(new Card(1, Suit.Clubs)); // best (trump)
    expect(game.currentRound.score).toEqual([1, 0]);
    expect(game.score).toEqual([1, 0]);
    expect(game.currentRound.isDone).toBe(true);
  });

  it("should mark score for the player with 1st round + a tie", () => {
    const customDeck = new Deck(
      [
        new Card(1, Suit.Hearts),
        new Card(1, Suit.Clubs),
        new Card(2, Suit.Hearts),
        new Card(2, Suit.Clubs),
        new Card(3, Suit.Hearts),
        new Card(3, Suit.Clubs),
        new Card(4, Suit.Spades),
      ],
      () => [
        new Card(4, Suit.Spades),
        new Card(1, Suit.Clubs),
        new Card(2, Suit.Clubs),
        new Card(3, Suit.Clubs),
        new Card(1, Suit.Hearts),
        new Card(2, Suit.Hearts),
        new Card(3, Suit.Hearts),
      ],
    );
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Player 1"),
      new TrucoPlayer(game, "Player 2"),
    ];
    const [player1, player2] = game.players;
    expect(player1.cards).toEqual([
      new Card(1, Suit.Clubs),
      new Card(2, Suit.Clubs),
      new Card(3, Suit.Clubs),
    ]);
    expect(player2.cards).toEqual([
      new Card(1, Suit.Hearts),
      new Card(2, Suit.Hearts),
      new Card(3, Suit.Hearts),
    ]);
    expect(game.currentRound.turnedCard).toEqual(new Card(4, Suit.Spades));
    expect(game.currentRound.isDone).toBe(false);
    player1.dropCard(new Card(3, Suit.Clubs)); // tie
    player2.dropCard(new Card(3, Suit.Hearts));
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.score).toBeUndefined();
    expect(game.score).toEqual([0, 0]);
    game.currentRound.continue();
    player1.dropCard(new Card(1, Suit.Clubs)); // best (highest trump)
    player2.dropCard(new Card(1, Suit.Hearts));
    expect(game.currentRound.isDone).toBe(true);
    expect(game.currentRound.score).toEqual([1, 0]);
    expect(game.score).toEqual([1, 0]);
  });

  it("should not not consider same cards of players from the same team as draws", () => {
    const customDeck = new Deck(
      [
        new Card(1, Suit.Diamonds),
        new Card(1, Suit.Spades),
        new Card(1, Suit.Hearts),
        new Card(1, Suit.Clubs),
        new Card(2, Suit.Diamonds),
        new Card(2, Suit.Spades),
        new Card(2, Suit.Hearts),
        new Card(2, Suit.Clubs),
        new Card(3, Suit.Diamonds),
        new Card(3, Suit.Spades),
        new Card(3, Suit.Hearts),
        new Card(3, Suit.Clubs),
        new Card(4, Suit.Spades),
      ],
      () => [
        new Card(4, Suit.Spades),
        new Card(1, Suit.Clubs),
        new Card(2, Suit.Clubs),
        new Card(3, Suit.Clubs),
        new Card(1, Suit.Hearts),
        new Card(2, Suit.Hearts),
        new Card(3, Suit.Hearts),
        new Card(1, Suit.Diamonds),
        new Card(2, Suit.Diamonds),
        new Card(3, Suit.Diamonds),
        new Card(1, Suit.Spades),
        new Card(2, Suit.Spades),
        new Card(3, Suit.Spades),
      ],
    );
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Player 1"),
      new TrucoPlayer(game, "Player 2"),
      new TrucoPlayer(game, "Player 3"),
      new TrucoPlayer(game, "Player 4"),
    ];
    const [player1, player2, player3, player4] = game.players;
    expect(game.currentRound.isDone).toBe(false);
    player1.dropCard(new Card(3, Suit.Clubs));
    player2.dropCard(new Card(2, Suit.Hearts));
    player3.dropCard(new Card(3, Suit.Diamonds));
    player4.dropCard(new Card(2, Suit.Spades));
    expect(game.currentRound.currentStep.isDone).toBe(true);
    expect(game.currentRound.currentStep.winner).toEqual(player1);
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.score).toEqual(undefined);
    expect(game.score).toEqual([0, 0]);
    game.currentRound.continue();
    player1.dropCard(new Card(1, Suit.Clubs));
    player2.dropCard(new Card(3, Suit.Hearts));
    player3.dropCard(new Card(2, Suit.Diamonds));
    player4.dropCard(new Card(3, Suit.Spades));
    expect(game.currentRound.currentStep.isDone).toBe(true);
    expect(game.currentRound.currentStep.winner).toEqual(player1);
    expect(game.currentRound.isDone).toBe(true);
    expect(game.currentRound.score).toEqual([1, 0]);
    expect(game.score).toEqual([1, 0]);
  });

  it("should handle a round with all draws", () => {
    const cards = [
      new Card(12, Suit.Spades),
      new Card(1, Suit.Hearts),
      new Card(1, Suit.Clubs),
      new Card(2, Suit.Hearts),
      new Card(2, Suit.Clubs),
      new Card(3, Suit.Hearts),
      new Card(3, Suit.Clubs),
      new Card(4, Suit.Hearts),
      new Card(4, Suit.Clubs),
    ];
    const shuffledCards = [
      new Card(12, Suit.Spades),
      new Card(4, Suit.Hearts),
      new Card(2, Suit.Hearts),
      new Card(3, Suit.Hearts),
      new Card(4, Suit.Clubs),
      new Card(2, Suit.Clubs),
      new Card(3, Suit.Clubs),
      new Card(1, Suit.Hearts),
      new Card(1, Suit.Clubs),
    ];
    const deck = new Deck(cards, () => [...shuffledCards]);
    const game = new TrucoGame(deck);
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    const [player1, player2] = game.players;
    expect(game.rounds).toHaveLength(1);
    player1.dropCard(new Card(3, Suit.Hearts));
    player2.dropCard(new Card(3, Suit.Clubs));
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.score).toBeUndefined();
    expect(game.score).toEqual([0, 0]);
    game.currentRound.continue();

    player1.dropCard(new Card(2, Suit.Hearts));
    player2.dropCard(new Card(2, Suit.Clubs));
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.score).toBeUndefined();
    expect(game.score).toEqual([0, 0]);
    game.currentRound.continue();

    player1.dropCard(new Card(4, Suit.Hearts));
    player2.dropCard(new Card(4, Suit.Clubs));
    expect(game.currentRound.isDone).toBe(true);
    expect(game.currentRound.score).toEqual([0, 0]);
    expect(game.score).toEqual([0, 0]);
  });

  it("should count raised stakes for the winner", () => {
    const customDeck = new Deck(
      [
        new Card(4, Suit.Clubs),
        new Card(5, Suit.Clubs),
        new Card(6, Suit.Clubs),
        new Card(7, Suit.Clubs),
        new Card(8, Suit.Clubs),
        new Card(9, Suit.Clubs),
        new Card(10, Suit.Clubs),
        new Card(11, Suit.Clubs),
      ],
      () => [
        new Card(10, Suit.Clubs), // avoid players cards to be trump
        new Card(4, Suit.Clubs),
        new Card(5, Suit.Clubs),
        new Card(6, Suit.Clubs),
        new Card(7, Suit.Clubs),
        new Card(8, Suit.Clubs),
        new Card(9, Suit.Clubs),
        new Card(11, Suit.Clubs),
      ],
    );
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Player 1"),
      new TrucoPlayer(game, "Player 2"),
    ];
    const [player1, player2] = game.players;
    game.currentRound.raiseStake(player1);
    // Do not consider raised stakes points before accepting
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.score).toBeUndefined();
    expect(game.score).toEqual([0, 0]);

    game.currentRound.stake.accept(player2);
    game.currentRound.raiseStake(player2);
    game.currentRound.stake.accept(player1);
    // Do not consider raised stakes points before win
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.score).toBeUndefined();
    expect(game.score).toEqual([0, 0]);

    player1.dropCard(new Card(4, Suit.Clubs));
    player2.dropCard(new Card(7, Suit.Clubs)); // best
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.score).toBeUndefined();
    expect(game.score).toEqual([0, 0]);
    game.currentRound.continue();

    player2.dropCard(new Card(8, Suit.Clubs)); // best
    player1.dropCard(new Card(5, Suit.Clubs));
    expect(game.currentRound.isDone).toBe(true);
    expect(game.currentRound.score).toEqual([0, 6]);
    expect(game.score).toEqual([0, 6]);
  });

  it("should count regular score if a team rejects the raised stakes", () => {
    const customDeck = new Deck(
      [
        new Card(4, Suit.Clubs),
        new Card(5, Suit.Clubs),
        new Card(6, Suit.Clubs),
        new Card(7, Suit.Clubs),
        new Card(8, Suit.Clubs),
        new Card(9, Suit.Clubs),
        new Card(10, Suit.Clubs),
        new Card(11, Suit.Clubs),
      ],
      () => [
        new Card(10, Suit.Clubs), // cause 11 to be the trump card
        new Card(4, Suit.Clubs),
        new Card(5, Suit.Clubs),
        new Card(6, Suit.Clubs),
        new Card(7, Suit.Clubs),
        new Card(8, Suit.Clubs),
        new Card(9, Suit.Clubs),
        new Card(11, Suit.Clubs),
      ],
    );
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Player 1"),
      new TrucoPlayer(game, "Player 2"),
    ];
    const [player1, player2] = game.players;
    game.currentRound.raiseStake(player1);
    game.currentRound.stake.accept(player2);
    game.currentRound.raiseStake(player2);
    game.currentRound.stake.reject(player1);
    expect(game.currentRound.isDone).toBe(true);
    expect(game.currentRound.score).toEqual([0, 3]);
    expect(game.score).toEqual([0, 3]);
  });
});

describe("end game", () => {
  const cardsFromLowestToHighest = [
    new Card(4, Suit.Spades),
    new Card(5, Suit.Spades),
    new Card(1, Suit.Hearts),
    new Card(1, Suit.Clubs),
    new Card(2, Suit.Hearts),
    new Card(2, Suit.Clubs),
    new Card(3, Suit.Hearts),
    new Card(3, Suit.Clubs),
  ];
  const shuffledCards = [
    new Card(4, Suit.Spades),
    new Card(3, Suit.Clubs),
    new Card(2, Suit.Clubs),
    new Card(1, Suit.Clubs),
    new Card(3, Suit.Hearts),
    new Card(2, Suit.Hearts),
    new Card(1, Suit.Hearts),
    new Card(5, Suit.Spades),
  ];

  it("should end game if one of the teams reach 12 points", () => {
    const customDeck = new Deck(cardsFromLowestToHighest, () => [
      ...shuffledCards,
    ]);
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    const [player1, player2] = game.players;

    for (const index of range(12, 1)) {
      const firstPlay = [
        [player1, new Card(3, Suit.Clubs)] as const, // win
        [player2, new Card(2, Suit.Hearts)] as const,
      ];
      const secondPlay = [
        [player1, new Card(1, Suit.Clubs)] as const, // draw
        [player2, new Card(1, Suit.Hearts)] as const,
      ];
      if (index % 2 === 0) {
        // player1 will always begin 2nd step because he won it
        firstPlay.reverse();
      }
      for (const [player, card] of firstPlay) {
        player.dropCard(card);
      }
      game.currentRound.continue();
      for (const [player, card] of secondPlay) {
        player.dropCard(card);
      }
      expect(game.score).toEqual([index, 0]);
      if (index < 12) {
        expect(game.isDone).toBe(false);
        game.continue();
      }
    }

    expect(game.isDone).toBe(true);
    expect(game.currentRound.isDone).toBe(true);
    expect(() => game.continue()).toThrowError(GameFinishedError);
    expect(() => game.currentRound.continue()).toThrowError(GameFinishedError);
    expect(() => player1.dropCard(new Card(2, Suit.Clubs))).toThrowError(
      NotYourTurnError,
    );
    expect(() => player2.dropCard(new Card(3, Suit.Hearts))).toThrowError(
      NotYourTurnError,
    );
  });

  it("should not count more than 12 points", () => {
    const customDeck = new Deck(cardsFromLowestToHighest, () => [
      ...shuffledCards,
    ]);
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    const [player1, player2] = game.players;

    for (const index of range(5)) {
      game.currentRound.raiseStake(player1);
      if (index === 0) {
        game.currentRound.stake.reject(player2);
      } else {
        game.currentRound.stake.accept(player2);
      }
      const firstPlay = [
        [player1, new Card(3, Suit.Clubs)] as const, // win
        [player2, new Card(2, Suit.Hearts)] as const,
      ];
      const secondPlay = [
        [player1, new Card(1, Suit.Clubs)] as const, // draw
        [player2, new Card(1, Suit.Hearts)] as const,
      ];
      if (index % 2 === 1) {
        firstPlay.reverse();
      }
      for (const [player, card] of firstPlay) {
        player.dropCard(card);
      }
      game.currentRound.continue();
      for (const [player, card] of secondPlay) {
        player.dropCard(card);
      }
      if (index < 4) {
        expect(game.score).toEqual([1 + index * 3, 0]);
        game.continue();
      }
    }

    expect(game.score).toEqual([12, 0]);
    expect(game.isDone).toBe(true);
    expect(game.currentRound.isDone).toBe(true);
    expect(() => game.continue()).toThrowError(GameFinishedError);
    expect(() => game.currentRound.continue()).toThrowError(GameFinishedError);
    expect(() => player1.dropCard(new Card(2, Suit.Clubs))).toThrowError(
      NotYourTurnError,
    );
    expect(() => player2.dropCard(new Card(3, Suit.Hearts))).toThrowError(
      NotYourTurnError,
    );
  });
});

describe("reset game", () => {
  const cardsFromLowestToHighest = [
    new Card(4, Suit.Spades),
    new Card(1, Suit.Hearts),
    new Card(1, Suit.Clubs),
    new Card(2, Suit.Hearts),
    new Card(2, Suit.Clubs),
    new Card(3, Suit.Hearts),
    new Card(3, Suit.Clubs),
  ];
  const shuffledCardsSo1stPlayerWins = [
    new Card(4, Suit.Spades),
    new Card(3, Suit.Clubs),
    new Card(2, Suit.Clubs),
    new Card(1, Suit.Clubs),
    new Card(3, Suit.Hearts),
    new Card(2, Suit.Hearts),
    new Card(1, Suit.Hearts),
  ];
  it("should allow reset game in the 1st round", () => {
    const customDeck = new Deck(cardsFromLowestToHighest, () => [
      ...shuffledCardsSo1stPlayerWins,
    ]);
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    for (const player of game.players) {
      player.dropCard(player.cards[0]);
    }
    game.reset();
    expect(game.isDone).toBe(false);
    expect(game.rounds).toHaveLength(1);
    expect(game.currentRound.currentPlayer).toEqual(game.players[0]);
    expect(game.currentRound.steps).toHaveLength(1);
    expect(game.currentRound.currentStep.cards).toEqual([]);
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.currentStep.isDone).toBe(false);
  });

  it("should allow reset game on intermediate rounds", () => {
    const customDeck = new Deck(cardsFromLowestToHighest, () => [
      ...shuffledCardsSo1stPlayerWins,
    ]);
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    for (const _index of range(3)) {
      for (const player of game.players) {
        player.dropCard(player.cards[0]);
      }
      if (!game.currentRound.isDone) {
        game.currentRound.continue();
      } else {
        game.continue();
      }
    }
    expect(game.score).not.toEqual([0, 0]);
    game.reset();
    expect(game.isDone).toBe(false);
    expect(game.score).toEqual([0, 0]);
    expect(game.rounds).toHaveLength(1);
    expect(game.currentRound.currentPlayer).toEqual(game.players[0]);
    expect(game.currentRound.steps).toHaveLength(1);
    expect(game.currentRound.currentStep.cards).toEqual([]);
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.currentStep.isDone).toBe(false);
  });

  it("should allow reset finished game", () => {
    const customDeck = new Deck(cardsFromLowestToHighest, () => [
      ...shuffledCardsSo1stPlayerWins,
    ]);
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    while (!game.isDone) {
      while (!game.currentRound.isDone) {
        while (!game.currentRound.currentStep.isDone) {
          game.currentRound.currentPlayer?.dropCard(
            game.currentRound.currentPlayer.cards[0],
          );
        }
        if (!game.currentRound.isDone) {
          game.currentRound.continue();
        }
      }
      if (!game.isDone) {
        game.continue();
      }
    }
    expect(game.score).toEqual([12, 0]);
    game.reset();
    expect(game.isDone).toBe(false);
    expect(game.score).toEqual([0, 0]);
    expect(game.rounds).toHaveLength(1);
    expect(game.currentRound.currentPlayer).toEqual(game.players[0]);
    expect(game.currentRound.steps).toHaveLength(1);
    expect(game.currentRound.currentStep.cards).toEqual([]);
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.currentStep.isDone).toBe(false);
  });

  it("should allow reset game with a new set of players", () => {
    const game = new TrucoGame(getDeck());
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
      new TrucoPlayer(game, "Meg"),
      new TrucoPlayer(game, "Marge"),
    ];
    expect(game.isDone).toBe(false);
    expect(game.score).toEqual([0, 0]);
    expect(game.rounds).toHaveLength(1);
    expect(game.players).toHaveLength(4);
    expect(game.players.map(({ name }) => name)).toEqual([
      "Jack",
      "Curtis",
      "Meg",
      "Marge",
    ]);
    expect(game.currentRound.currentPlayer).toEqual(game.players[0]);
    expect(game.currentRound.steps).toHaveLength(1);
    expect(game.currentRound.currentStep.cards).toEqual([]);
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.currentStep.isDone).toBe(false);

    game.reset([new TrucoPlayer(game, "Will"), new TrucoPlayer(game, "Gus")]);
    expect(game.isDone).toBe(false);
    expect(game.score).toEqual([0, 0]);
    expect(game.rounds).toHaveLength(1);
    expect(game.players).toHaveLength(2);
    expect(game.players.map(({ name }) => name)).toEqual(["Will", "Gus"]);
    expect(game.currentRound.currentPlayer).toEqual(game.players[0]);
    expect(game.currentRound.steps).toHaveLength(1);
    expect(game.currentRound.currentStep.cards).toEqual([]);
    expect(game.currentRound.isDone).toBe(false);
    expect(game.currentRound.currentStep.isDone).toBe(false);
  });
});

describe("mimic cards", () => {
  it("should display mimic card but drop real card instead", () => {
    const cardsFromLowestToHighest = [
      new Card(50, Suit.Spades, true),
      new Card(50, Suit.Diamonds, true),
      new Card(1, Suit.Hearts),
      new Card(1, Suit.Clubs),
      new Card(2, Suit.Hearts),
      new Card(2, Suit.Clubs),
      new Card(3, Suit.Hearts),
      new Card(3, Suit.Clubs),
      new Card(4, Suit.Hearts),
      new Card(4, Suit.Clubs),
      new Card(5, Suit.Hearts),
      new Card(5, Suit.Clubs),
    ];
    const shuffledCards = [
      new Card(4, Suit.Hearts),
      new Card(50, Suit.Spades, true),
      new Card(3, Suit.Clubs),
      new Card(2, Suit.Clubs),
      new Card(1, Suit.Clubs),
      new Card(3, Suit.Hearts),
      new Card(50, Suit.Spades, true),
      new Card(2, Suit.Hearts),
      new Card(1, Suit.Hearts),
      new Card(5, Suit.Hearts),
      new Card(5, Suit.Clubs),
      new Card(4, Suit.Clubs),
    ];
    const customDeck = new Deck(cardsFromLowestToHighest, () => [
      ...shuffledCards,
    ]);
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    expect(game.currentRound.turnedCard).toEqual(new Card(4, Suit.Hearts));
    expect(game.currentRound.trumpCards).toEqual([
      new Card(5, Suit.Clubs),
      new Card(5, Suit.Hearts),
    ]);
    const [player1, player2] = game.players;
    expect(player1.cards).toEqual([
      new Card(50, Suit.Spades, true),
      new Card(2, Suit.Clubs),
      new Card(1, Suit.Clubs),
    ]);
    expect(player1.displayCards).toEqual([
      new Card(3, Suit.Clubs),
      new Card(2, Suit.Clubs),
      new Card(1, Suit.Clubs),
    ]);
    expect(player2.cards).toEqual([
      new Card(3, Suit.Hearts),
      new Card(50, Suit.Spades, true),
      new Card(1, Suit.Hearts),
    ]);
    expect(player2.displayCards).toEqual([
      new Card(3, Suit.Hearts),
      new Card(2, Suit.Hearts),
      new Card(1, Suit.Hearts),
    ]);
    // Player should drop display card but step will receive mimic
    expect(() => player1.dropCard(new Card(50, Suit.Spades))).toThrowError(
      CardNotFoundError,
    );
    player1.dropCard(new Card(3, Suit.Clubs));
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(50, Suit.Spades, true) },
    ]);
    player2.dropCard(new Card(1, Suit.Hearts));
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(50, Suit.Spades, true) },
      { card: new Card(1, Suit.Hearts) },
    ]);
    expect(game.currentRound.currentStep.winner).toEqual(player2);
  });

  it("should not consider mimic cards trump cards definition", () => {
    const cardsFromLowestToHighest = [
      new Card(50, Suit.Spades, true),
      new Card(50, Suit.Diamonds, true),
      new Card(1, Suit.Hearts),
      new Card(1, Suit.Clubs),
      new Card(2, Suit.Hearts),
      new Card(2, Suit.Clubs),
      new Card(3, Suit.Hearts),
      new Card(3, Suit.Clubs),
      new Card(4, Suit.Hearts),
      new Card(4, Suit.Clubs),
      new Card(5, Suit.Hearts),
      new Card(5, Suit.Clubs),
    ];
    const shuffledCards = [
      new Card(5, Suit.Clubs),
      new Card(50, Suit.Spades, true),
      new Card(3, Suit.Clubs),
      new Card(2, Suit.Clubs),
      new Card(1, Suit.Clubs),
      new Card(3, Suit.Hearts),
      new Card(50, Suit.Spades, true),
      new Card(2, Suit.Hearts),
      new Card(1, Suit.Hearts),
      new Card(5, Suit.Clubs),
      new Card(4, Suit.Hearts),
      new Card(4, Suit.Clubs),
    ];
    const customDeck = new Deck(cardsFromLowestToHighest, () => [
      ...shuffledCards,
    ]);
    const game = new TrucoGame(customDeck);
    game.players = [
      new TrucoPlayer(game, "Jack"),
      new TrucoPlayer(game, "Curtis"),
    ];
    expect(game.currentRound.turnedCard).toEqual(new Card(5, Suit.Clubs));
    expect(game.currentRound.trumpCards).toEqual([
      new Card(1, Suit.Clubs),
      new Card(1, Suit.Hearts),
    ]);
    const [player1, player2] = game.players;
    expect(player1.cards).toEqual([
      new Card(50, Suit.Spades, true),
      new Card(2, Suit.Clubs),
      new Card(1, Suit.Clubs),
    ]);
    expect(player1.displayCards).toEqual([
      new Card(3, Suit.Clubs),
      new Card(2, Suit.Clubs),
      new Card(1, Suit.Clubs),
    ]);
    expect(player2.cards).toEqual([
      new Card(3, Suit.Hearts),
      new Card(50, Suit.Spades, true),
      new Card(1, Suit.Hearts),
    ]);
    expect(player2.displayCards).toEqual([
      new Card(3, Suit.Hearts),
      new Card(2, Suit.Hearts),
      new Card(1, Suit.Hearts),
    ]);
    // Player should drop display card but step will receive mimic
    expect(() => player1.dropCard(new Card(50, Suit.Spades))).toThrowError(
      CardNotFoundError,
    );
    player1.dropCard(new Card(3, Suit.Clubs));
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(50, Suit.Spades, true) },
    ]);
    player2.dropCard(new Card(3, Suit.Hearts));
    assertStepHasCards(game.currentRound.currentStep, [
      { card: new Card(50, Suit.Spades, true) },
      { card: new Card(3, Suit.Hearts) },
    ]);
    expect(game.currentRound.currentStep.winner).toEqual(player2);
  });
});

function assertStepHasCards(
  step: Step,
  expectedCards: SetRequired<Partial<StepCard>, "card">[],
) {
  expect(step.cards).toHaveLength(expectedCards.length);
  step.cards.forEach((card, index) => {
    expect(card).toMatchObject({
      isHidden: false,
      isBest: expect.any(Boolean),
      ...expectedCards[index],
    });
  });
}

function getDeck() {
  const cards = [
    new Card(12, Suit.Diamonds),
    new Card(12, Suit.Spades),
    new Card(1, Suit.Hearts),
    new Card(1, Suit.Clubs),
    new Card(2, Suit.Hearts),
    new Card(2, Suit.Clubs),
    new Card(3, Suit.Hearts),
    new Card(3, Suit.Clubs),
    new Card(4, Suit.Hearts),
    new Card(4, Suit.Clubs),
    new Card(5, Suit.Hearts),
    new Card(5, Suit.Clubs),
    new Card(6, Suit.Hearts),
    new Card(6, Suit.Clubs),
  ];
  const shuffledCards = [
    new Card(12, Suit.Spades),
    new Card(1, Suit.Hearts),
    new Card(2, Suit.Hearts),
    new Card(3, Suit.Hearts),
    new Card(1, Suit.Clubs),
    new Card(2, Suit.Clubs),
    new Card(3, Suit.Clubs),
    new Card(12, Suit.Diamonds),
    new Card(4, Suit.Hearts),
    new Card(5, Suit.Hearts),
    new Card(6, Suit.Hearts),
    new Card(4, Suit.Clubs),
    new Card(5, Suit.Clubs),
    new Card(6, Suit.Clubs),
  ];
  return new Deck(cards, () => [...shuffledCards]);
}
