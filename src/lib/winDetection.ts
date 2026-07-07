/**
 * Win detection for bingo.
 * Checks if a card has achieved a winning pattern:
 * - Horizontal line (any row fully marked)
 * - Vertical line (any column fully marked)
 * - Diagonal line (either diagonal fully marked)
 * - Full house (all 25 squares marked, including free space)
 */

import type { BingoCard } from './bingoCard';

export type WinType = 'horizontal' | 'vertical' | 'diagonal' | 'full-house';

export interface WinResult {
  won: boolean;
  type?: WinType;
  /** For lines: which row/col/diagonal index. For full house: all. */
  details?: string;
}

/** Check a single bingo card for any win */
export function checkCardForWin(card: BingoCard): WinResult {
  // Check horizontal lines (rows)
  for (let row = 0; row < 5; row++) {
    if (card.marked[row].every((m) => m)) {
      return { won: true, type: 'horizontal', details: `Row ${row + 1}` };
    }
  }

  // Check vertical lines (columns)
  for (let col = 0; col < 5; col++) {
    let allMarked = true;
    for (let row = 0; row < 5; row++) {
      if (!card.marked[row][col]) {
        allMarked = false;
        break;
      }
    }
    if (allMarked) {
      return { won: true, type: 'vertical', details: `Column ${col + 1}` };
    }
  }

  // Check diagonal (top-left to bottom-right)
  let diag1 = true;
  for (let i = 0; i < 5; i++) {
    if (!card.marked[i][i]) {
      diag1 = false;
      break;
    }
  }
  if (diag1) {
    return { won: true, type: 'diagonal', details: 'Top-left to bottom-right' };
  }

  // Check diagonal (top-right to bottom-left)
  let diag2 = true;
  for (let i = 0; i < 5; i++) {
    if (!card.marked[i][4 - i]) {
      diag2 = false;
      break;
    }
  }
  if (diag2) {
    return { won: true, type: 'diagonal', details: 'Top-right to bottom-left' };
  }

  // Check full house — all 25 squares marked
  let allMarked = true;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (!card.marked[row][col]) {
        allMarked = false;
        break;
      }
    }
    if (!allMarked) break;
  }
  if (allMarked) {
    return { won: true, type: 'full-house', details: 'All squares marked' };
  }

  return { won: false };
}

/** Check multiple cards for wins and return all that have won */
export function checkCardsForWins(cards: BingoCard[]): Array<{ cardId: string } & WinResult> {
  const results: Array<{ cardId: string } & WinResult> = [];
  for (const card of cards) {
    const result = checkCardForWin(card);
    if (result.won) {
      results.push({ cardId: card.id, ...result });
    }
  }
  return results;
}

/**
 * Auto-daub: mark all called numbers on a card.
 * Returns the updated card (mutates in place as well).
 */
export function autoDaub(card: BingoCard, calledNumbers: Set<number>): BingoCard {
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const num = card.grid[row][col];
      // Skip free space (already marked)
      if (num === 0) continue;
      if (calledNumbers.has(num)) {
        card.marked[row][col] = true;
      }
    }
  }
  return card;
}

/** Auto-daub multiple cards at once */
export function autoDaubCards(cards: BingoCard[], calledNumbers: Set<number>): BingoCard[] {
  for (const card of cards) {
    autoDaub(card, calledNumbers);
  }
  return cards;
}