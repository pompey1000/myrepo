/**
 * Bingo game server functions.
 * These are TanStack Start server functions that the frontend calls
 * to interact with the bingo game engine.
 */

import { createServerFn } from '@tanstack/react-start';
import {
  generateCards,
  generateCard,
  createNumberCaller,
  callNextNumber,
  getCalledNumbers,
  getCurrentNumber,
  checkCardForWin,
  autoDaubCards,
  createGame,
  addPlayer,
  startGame,
  progressGame,
  serializeGame,
  GAME_CONFIGS,
} from '../lib';
import type { BingoCard } from '../lib';
import type { GameType } from '../lib';

// ─── In-memory game store ────────────────────────────────────────────
// For MVP: games live in server memory. Will be replaced with DB later.
import type { GameState } from '../lib/gameState';

// We need to use a module-level store. Since createServerFn handlers
// can import shared state, we use a Map keyed by game ID.
const gameStore = new Map<string, GameState>();

// ─── Card Generation ─────────────────────────────────────────────────

export const getBingoCards = createServerFn({ method: 'GET' })
  .validator((count: number) => count)
  .handler(async (ctx) => {
    const count = Math.min(Math.max(ctx.data, 1), 10);
    const cards = generateCards(count);
    // Return cards without marked state for initial display
    return cards.map((c) => ({
      id: c.id,
      grid: c.grid,
      marked: c.marked,
    }));
  });

// ─── Number Caller ───────────────────────────────────────────────────

export const createNewCaller = createServerFn({ method: 'GET' })
  .handler(async () => {
    const caller = createNumberCaller();
    return {
      calledNumbers: getCalledNumbers(caller),
      currentNumber: getCurrentNumber(caller),
      totalCalled: 0,
      remaining: 75,
    };
  });

// ─── Win Detection ───────────────────────────────────────────────────

export const checkWin = createServerFn({ method: 'POST' })
  .validator((data: { grid: number[][]; marked: boolean[][] }) => data)
  .handler(async (ctx) => {
    const card: BingoCard = {
      id: 'check',
      grid: ctx.data.grid,
      marked: ctx.data.marked,
    };
    return checkCardForWin(card);
  });

// ─── Game Management ─────────────────────────────────────────────────

export const apiCreateGame = createServerFn({ method: 'POST' })
  .validator((data: { type: GameType }) => data)
  .handler(async (ctx) => {
    const game = createGame(ctx.data.type);
    gameStore.set(game.id, game);
    return serializeGame(game);
  });

export const apiJoinGame = createServerFn({ method: 'POST' })
  .validator((data: { gameId: string; playerId: string; username: string; cardCount?: number }) => data)
  .handler(async (ctx) => {
    const game = gameStore.get(ctx.data.gameId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'waiting') throw new Error('Game already started');
    const player = addPlayer(game, ctx.data.playerId, ctx.data.username, ctx.data.cardCount);
    return {
      player,
      game: serializeGame(game),
    };
  });

export const apiStartGame = createServerFn({ method: 'POST' })
  .validator((data: { gameId: string }) => data)
  .handler(async (ctx) => {
    const game = gameStore.get(ctx.data.gameId);
    if (!game) throw new Error('Game not found');
    const started = startGame(game);
    if (!started) throw new Error('Failed to start game');
    return serializeGame(game);
  });

export const apiNextNumber = createServerFn({ method: 'POST' })
  .validator((data: { gameId: string }) => data)
  .handler(async (ctx) => {
    const game = gameStore.get(ctx.data.gameId);
    if (!game) throw new Error('Game not found');
    const result = progressGame(game);
    return {
      ...result,
      game: serializeGame(game),
    };
  });

export const apiGetGame = createServerFn({ method: 'GET' })
  .validator((data: { gameId: string }) => data)
  .handler(async (ctx) => {
    const game = gameStore.get(ctx.data.gameId);
    if (!game) throw new Error('Game not found');
    return serializeGame(game);
  });

export const apiGetGameConfigs = createServerFn({ method: 'GET' })
  .handler(async () => {
    return Object.entries(GAME_CONFIGS).map(([key, config]) => ({
      type: key,
      ...config,
    }));
  });

// ─── Cleanup old games ──────────────────────────────────────────────
// Periodically clean up finished games older than 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [id, game] of gameStore.entries()) {
    if (game.status === 'finished' && now - game.createdAt > 3600000) {
      gameStore.delete(id);
    }
  }
}, 600000); // every 10 minutes
