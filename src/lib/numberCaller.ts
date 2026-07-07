/**
 * Number caller for bingo.
 * Generates the sequence of called numbers (1-75 shuffled uniquely).
 * Tracks which numbers have been called and returns the next one.
 */

export interface NumberCallerState {
  /** All numbers from 1-75 in shuffled order */
  sequence: number[];
  /** Current index in the sequence (next number to call) */
  currentIndex: number;
  /** Set of numbers already called for quick lookup */
  calledSet: Set<number>;
}

/** Create a fresh shuffled sequence of 1-75 */
function createShuffledSequence(): number[] {
  const numbers = Array.from({ length: 75 }, (_, i) => i + 1);
  // Fisher-Yates shuffle
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
}

/** Create a new number caller state */
export function createNumberCaller(): NumberCallerState {
  return {
    sequence: createShuffledSequence(),
    currentIndex: 0,
    calledSet: new Set(),
  };
}

/** Get the next number in the sequence. Returns null if all numbers have been called. */
export function callNextNumber(state: NumberCallerState): number | null {
  if (state.currentIndex >= 75) {
    return null;
  }
  const number = state.sequence[state.currentIndex];
  state.currentIndex++;
  state.calledSet.add(number);
  return number;
}

/** Get the current number that was just called (the last one in the sequence) */
export function getCurrentNumber(state: NumberCallerState): number | null {
  if (state.currentIndex === 0) {
    return null;
  }
  return state.sequence[state.currentIndex - 1];
}

/** Get all numbers that have been called so far, in the order they were called */
export function getCalledNumbers(state: NumberCallerState): number[] {
  return state.sequence.slice(0, state.currentIndex);
}

/** Get the count of numbers called so far */
export function getCalledCount(state: NumberCallerState): number {
  return state.currentIndex;
}

/** Check if a specific number has been called */
export function isNumberCalled(state: NumberCallerState, number: number): boolean {
  return state.calledSet.has(number);
}

/** Get the remaining numbers not yet called */
export function getRemainingNumbers(state: NumberCallerState): number[] {
  return state.sequence.slice(state.currentIndex);
}

/** Get the BINGO column label for a number */
export function getNumberColumn(number: number): string {
  if (number >= 1 && number <= 15) return 'B';
  if (number >= 16 && number <= 30) return 'I';
  if (number >= 31 && number <= 45) return 'N';
  if (number >= 46 && number <= 60) return 'G';
  if (number >= 61 && number <= 75) return 'O';
  return '?';
}

/** Serialize caller state for API responses */
export function serializeCallerState(state: NumberCallerState) {
  return {
    calledNumbers: getCalledNumbers(state),
    currentNumber: getCurrentNumber(state),
    totalCalled: getCalledCount(state),
    remaining: 75 - getCalledCount(state),
  };
}