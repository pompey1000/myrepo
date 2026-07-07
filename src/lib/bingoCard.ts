/**
 * Bingo card generator.
 * Generates a valid 5x5 bingo card with:
 *   B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
 *   Free space in the center (row 2, col 2)
 *   No duplicate numbers per card
 *   Each card is unique (different random numbers)
 */

export interface BingoCard {
  id: string;
  /** 5x5 grid, grid[row][col] */
  grid: number[][];
  /** Which squares are marked (true = marked), same shape as grid */
  marked: boolean[][];
}

/** Column ranges for BINGO: B, I, N, G, O */
const COLUMN_RANGES: [number, number][] = [
  [1, 15],   // B
  [16, 30],  // I
  [31, 45],  // N
  [46, 60],  // G
  [61, 75],  // O
];

/** Get a random integer between min and max (inclusive) */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Shuffle an array in place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generate a single random bingo card */
export function generateCard(id: string): BingoCard {
  const grid: number[][] = [];
  const marked: boolean[][] = [];

  for (let col = 0; col < 5; col++) {
    const [min, max] = COLUMN_RANGES[col];
    // Pick 5 unique numbers from the column range
    const pool = shuffle(
      Array.from({ length: max - min + 1 }, (_, i) => min + i)
    );
    const columnNumbers = pool.slice(0, 5);
    // Sort column numbers ascending (traditional bingo card style)
    columnNumbers.sort((a, b) => a - b);

    for (let row = 0; row < 5; row++) {
      if (!grid[row]) {
        grid[row] = [];
        marked[row] = [];
      }
      grid[row][col] = columnNumbers[row];
      marked[row][col] = false;
    }
  }

  // Free space in the center (row 2, col 2)
  grid[2][2] = 0;
  marked[2][2] = true;

  return { id, grid, marked };
}

/** Generate multiple unique cards */
export function generateCards(count: number): BingoCard[] {
  const cards: BingoCard[] = [];
  for (let i = 0; i < count; i++) {
    cards.push(generateCard(`card-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`));
  }
  return cards;
}

/** Get the column label (B, I, N, G, O) for a column index */
export function getColumnLabel(col: number): string {
  return ['B', 'I', 'N', 'G', 'O'][col] ?? '?';
}