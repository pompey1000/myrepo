/**
 * Game state manager for bingo.
 * Manages a single game session including:
 * - Game type (mini/major/mega)
 * - Available numbers / called numbers
 * - Players and their cards
 * - Win checking after each number call
 */

import type { BingoCard } from './bingoCard';
import { generateCards } from './bingoCard';
import type { NumberCallerState } from './numberCaller';
import { createNumberCaller, callNextNumber, getCalledNumbers } from './numberCaller';
import type { WinResult } from './winDetection';
import { checkCardsForWins, autoDaubCards } from './winDetection';

export type GameType = 'mini' | 'major' | 'mega';

export interface Player {
  id: string;
  username: string;
  cards: BingoCard[];
  hasWon: boolean;
}

export interface GameState {
  id: string;
  type: GameType;
  status: 'waiting' | 'active' | 'finished';
  numberCaller: NumberCallerState;
  players: Player[];
  winners: Array<{
    playerId: string;
    username: string;
    cardId: string;
    winResult: WinResult;
  }>;
  createdAt: number;
}

/** Game config per tier */
export const GAME_CONFIGS: Record<GameType, {
  label: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  cardsPerPlayer: number;
}> = {
  mini: {
    label: 'Mini Bingo',
    entryFee: 0.50,
    prizePool: 5,
    maxPlayers: 10,
    cardsPerPlayer: 3,
  },
  major: {
    label: 'Major Bingo',
    entryFee: 2,
    prizePool: 50,
    maxPlayers: 8,
    cardsPerPlayer: 5,
  },
  mega: {
    label: 'Mega Bingo',
    entryFee: 5,
    prizePool: 500,
    maxPlayers: 5,
    cardsPerPlayer: 8,
  },
};

/** Create a new game session */
export function createGame(type: GameType): GameState {
  const id = `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    type,
    status: 'waiting',
    numberCaller: createNumberCaller(),
    players: [],
    winners: [],
    createdAt: Date.now(),
  };
}

/** Add a player to a game */
export function addPlayer(game: GameState, playerId: string, username: string, cardCount?: number): Player {
  const config = GAME_CONFIGS[game.type];
  const count = cardCount ?? config.cardsPerPlayer;
  const capped = Math.min(Math.max(count, 1), 10);
  const cards = generateCards(capped);
  const player: Player = { id: playerId, username, cards, hasWon: false };
  game.players.push(player);
  return player;
}

/** Start a game (must have at least 1 player) */
export function startGame(game: GameState): boolean {
  if (game.players.length < 1) return false;
  if (game.status !== 'waiting') return false;
  game.status = 'active';
  return true;
}

export interface ProgressResult {
  number: number | null;
  winners: Array<{ playerId: string; username: string; cardId: string; winResult: WinResult }>;
  gameOver: boolean;
}

/** Call the next number and auto-daub all player cards */
export function progressGame(game: GameState): ProgressResult {
  if (game.status !== 'active') {
    return { number: null, winners: [], gameOver: game.status === 'finished' };
  }

  // Call the next number
  const number = callNextNumber(game.numberCaller);
  if (number === null) {
    // All numbers called — game is a draw
    game.status = 'finished';
    return { number: null, winners: [], gameOver: true };
  }

  // Get the called numbers set
  const calledSet = new Set(getCalledNumbers(game.numberCaller));

  // Auto-daub all player cards
  for (const player of game.players) {
    autoDaubCards(player.cards, calledSet);
  }

  // Check for winners (excluding players who already won)
  for (const player of game.players) {
    if (player.hasWon) continue;
    const wins = checkCardsForWins(player.cards);
    if (wins.length > 0) {
      player.hasWon = true;
      for (const win of wins) {
        game.winners.push({
          playerId: player.id,
          username: player.username,
          cardId: win.cardId,
          winResult: win,
        });
      }
    }
  }

  // Check if everyone has won or all numbers called — game over
  const allPlayersWon = game.players.every((p) => p.hasWon);
  if (allPlayersWon) {
    game.status = 'finished';
  }

  return {
    number,
    winners: game.winners.slice(-game.players.length), // latest winners this round
    gameOver: game.status === 'finished',
  };
}

/** Check if a specific player has won */
export function hasPlayerWon(game: GameState, playerId: string): boolean {
  return game.winners.some((w) => w.playerId === playerId);
}

/** Get serializable game state for API responses */
export function serializeGame(game: GameState) {
  const config = GAME_CONFIGS[game.type];
  return {
    id: game.id,
    type: game.type,
    label: config.label,
    status: game.status,
    entryFee: config.entryFee,
    prizePool: config.prizePool,
    players: game.players.map((p) => ({
      id: p.id,
      username: p.username,
      cardCount: p.cards.length,
      hasWon: p.hasWon,
      cards: p.cards.map((c) => ({
        id: c.id,
        grid: c.grid,
        marked: c.marked,
      })),
    })),
    winners: game.winners,
    callerState: {
      calledNumbers: getCalledNumbers(game.numberCaller),
      totalCalled: game.numberCaller.currentIndex,
      remaining: 75 - game.numberCaller.currentIndex,
    },
    createdAt: game.createdAt,
  };
}