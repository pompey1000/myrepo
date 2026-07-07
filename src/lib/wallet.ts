/**
 * Client-side wallet system using localStorage.
 * Manages player balance, purchase history, and Stripe payment tracking.
 */

const WALLET_KEY = 'bingoJackpot_wallet';
const HISTORY_KEY = 'bingoJackpot_history';
const PENDING_KEY = 'bingoJackpot_pending';

export interface PurchaseRecord {
  id: string;
  product: string;
  amount: number;
  price: number;
  timestamp: number;
}

export interface WalletState {
  balance: number;
}

function getWallet(): WalletState {
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { balance: 0 };
}

function saveWallet(wallet: WalletState): void {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
}

function generateId(): string {
  return `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Get the current balance */
export function getBalance(): number {
  return getWallet().balance;
}

/** Get formatted balance string */
export function getBalanceFormatted(): string {
  return `$${getBalance().toFixed(2)}`;
}

/** Add funds to the balance */
export function addFunds(amount: number): number {
  const wallet = getWallet();
  wallet.balance += amount;
  saveWallet(wallet);
  return wallet.balance;
}

/** Deduct funds from the balance. Returns false if insufficient. */
export function deductFunds(amount: number): boolean {
  const wallet = getWallet();
  if (wallet.balance < amount) return false;
  wallet.balance -= amount;
  saveWallet(wallet);
  return true;
}

/** Check if balance can cover an amount */
export function canAfford(amount: number): boolean {
  return getBalance() >= amount;
}

// ─── Purchase History ──────────────────────────────────────────────

/** Get purchase history */
export function getHistory(): PurchaseRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/** Add a purchase record */
export function addPurchase(product: string, amount: number, price: number): PurchaseRecord {
  const record: PurchaseRecord = {
    id: generateId(),
    product,
    amount,
    price,
    timestamp: Date.now(),
  };
  const history = getHistory();
  history.unshift(record);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return record;
}

/** Clear all history */
export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// ─── Pending Stripe Purchases ──────────────────────────────────────

export interface PendingPurchase {
  product: string;
  amount: number;
  price: number;
  stripeUrl: string;
  timestamp: number;
}

/** Store a pending purchase (before opening Stripe) */
export function setPendingPurchase(purchase: PendingPurchase): void {
  localStorage.setItem(PENDING_KEY, JSON.stringify(purchase));
}

/** Get the pending purchase */
export function getPendingPurchase(): PendingPurchase | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/** Clear the pending purchase */
export function clearPendingPurchase(): void {
  localStorage.removeItem(PENDING_KEY);
}

/** Confirm a pending purchase — adds balance and clears pending */
export function confirmPendingPurchase(): boolean {
  const pending = getPendingPurchase();
  if (!pending) return false;

  addFunds(pending.amount);
  addPurchase(pending.product, pending.amount, pending.price);
  clearPendingPurchase();
  return true;
}

// ─── Stripe Payment Links ──────────────────────────────────────────

export interface ShopItem {
  id: string;
  product: string;
  description: string;
  amount: number;
  price: number;
  stripeUrl: string;
  icon: string;
  category: 'cards' | 'entry';
}

export const SHOP_ITEMS: ShopItem[] = [
  // Card Bundles
  {
    id: 'card-1',
    product: 'Single Bingo Card',
    description: '1 bingo card for your next game',
    amount: 1,
    price: 1.00,
    stripeUrl: 'https://buy.stripe.com/6oU5kDeZr4br2MK9gbcwg08',
    icon: '🎫',
    category: 'cards',
  },
  {
    id: 'card-3',
    product: 'Bingo Card Trio',
    description: '3 bingo cards — save $1!',
    amount: 3,
    price: 2.00,
    stripeUrl: 'https://buy.stripe.com/6oU6oH4kN4br1IGcsncwg03',
    icon: '🎟️',
    category: 'cards',
  },
  {
    id: 'card-5',
    product: 'Bingo Card 5-Pack',
    description: '5 bingo cards — best value!',
    amount: 5,
    price: 3.00,
    stripeUrl: 'https://buy.stripe.com/fZu28r9F76jzdro4ZVcwg06',
    icon: '🎰',
    category: 'cards',
  },
  // Game Entries
  {
    id: 'entry-mini',
    product: 'Mini Bingo Entry',
    description: 'Entry to 1 Mini Bingo game',
    amount: 1,
    price: 0.50,
    stripeUrl: 'https://buy.stripe.com/bJeeVd7wZazP2MK8c7cwg04',
    icon: '🎯',
    category: 'entry',
  },
  {
    id: 'entry-major',
    product: 'Major Bingo Entry',
    description: 'Entry to 1 Major Bingo game',
    amount: 1,
    price: 2.00,
    stripeUrl: 'https://buy.stripe.com/fZufZh2cFbDTafcbojcwg07',
    icon: '💎',
    category: 'entry',
  },
  {
    id: 'entry-mega',
    product: 'Mega Bingo Entry',
    description: 'Entry to 1 Mega Bingo game',
    amount: 1,
    price: 5.00,
    stripeUrl: 'https://buy.stripe.com/9B64gz5oR4br2MK1NJcwg05',
    icon: '👑',
    category: 'entry',
  },
];
