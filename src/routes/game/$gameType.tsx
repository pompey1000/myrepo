import { useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { apiCreateGame, apiJoinGame, apiStartGame, apiNextNumber, apiGetGame } from "../../lib/server-functions";
import type { GameType } from "../../lib/gameState";
import { GAME_CONFIGS } from "../../lib/gameState";
import { getBalance, getBalanceFormatted, deductFunds, canAfford } from "../../lib/wallet";

export const Route = createFileRoute("/game/$gameType")({
  component: GamePage,
});

// ─── Types ─────────────────────────────────────────────────────────

interface SerializedCard {
  id: string;
  grid: number[][];
  marked: boolean[][];
}

interface SerializedPlayer {
  id: string;
  username: string;
  cardCount: number;
  hasWon: boolean;
  cards: SerializedCard[];
}

interface SerializedGame {
  id: string;
  type: string;
  label: string;
  status: string;
  entryFee: number;
  prizePool: number;
  players: SerializedPlayer[];
  winners: Array<{
    playerId: string;
    username: string;
    cardId: string;
    winResult: { won: boolean; type?: string; details?: string };
  }>;
  callerState: {
    calledNumbers: number[];
    totalCalled: number;
    remaining: number;
  };
  createdAt: number;
}

type PageState = "lobby" | "playing" | "finished";

// ─── Helpers ───────────────────────────────────────────────────────

function getNumberColumn(number: number): string {
  if (number >= 1 && number <= 15) return "B";
  if (number >= 16 && number <= 30) return "I";
  if (number >= 31 && number <= 45) return "N";
  if (number >= 46 && number <= 60) return "G";
  if (number >= 61 && number <= 75) return "O";
  return "?";
}

function getNumberColor(number: number): string {
  const col = getNumberColumn(number);
  switch (col) {
    case "B": return "text-red-400";
    case "I": return "text-orange-400";
    case "N": return "text-gray-300";
    case "G": return "text-green-400";
    case "O": return "text-blue-400";
    default: return "text-white";
  }
}

const tierGradients: Record<string, string> = {
  mini: "from-green-900/40 to-green-950",
  major: "from-yellow-900/40 to-yellow-950",
  mega: "from-red-900/40 to-red-950",
};

const tierAccent: Record<string, string> = {
  mini: "border-green-500/50",
  major: "border-yellow-500/50",
  mega: "border-red-500/50",
};

const tierColors: Record<string, string> = {
  mini: "text-green-400",
  major: "text-yellow-400",
  mega: "text-red-400",
};

// ─── Bingo Card Component ─────────────────────────────────────────

function BingoCardDisplay({ card }: { card: SerializedCard }) {
  const headers = ["B", "I", "N", "G", "O"];

  return (
    <div className="bingo-card w-full max-w-[280px] sm:max-w-[320px]">
      <div className="bingo-card-header">BINGO</div>
      <div className="p-1">
        {/* Column Headers */}
        <div className="grid grid-cols-5 gap-px">
          {headers.map((h) => (
            <div key={h} className="bingo-column-header">{h}</div>
          ))}
        </div>
        {/* Grid */}
        <div className="mt-px grid grid-cols-5 gap-px">
          {card.grid.map((row, ri) =>
            row.map((num, ci) => {
              const isFree = num === 0;
              const isCalled = card.marked[ri][ci] && !isFree;
              const cellKey = `${ri}-${ci}`;

              return (
                <div
                  key={cellKey}
                  className={`bingo-cell text-xs sm:text-sm md:text-base font-bold rounded-sm
                    ${isFree ? "bingo-cell-free" : ""}
                    ${isCalled ? "bingo-cell-called" : ""}
                    ${!isFree && !isCalled ? "hover:bg-amber-100" : ""}
                  `}
                >
                  {isFree ? (
                    <span className="text-lg sm:text-xl">⭐</span>
                  ) : (
                    <span>{num}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Called Numbers Board ─────────────────────────────────────────

function CalledNumbersBoard({ numbers }: { numbers: number[] }) {
  const calledSet = new Set(numbers);
  const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);

  const columns = [
    { label: "B", range: [1, 15] },
    { label: "I", range: [16, 30] },
    { label: "N", range: [31, 45] },
    { label: "G", range: [46, 60] },
    { label: "O", range: [61, 75] },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
      <h3 className="mb-3 text-center text-sm font-bold text-gray-400 uppercase tracking-wider">
        Called Numbers
      </h3>
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {columns.map((col) => (
          <div key={col.label}>
            <div className="mb-1 text-center text-xs font-bold text-bingo-gold">
              {col.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {Array.from(
                { length: col.range[1] - col.range[0] + 1 },
                (_, i) => col.range[0] + i
              ).map((num) => (
                <div
                  key={num}
                  className={`rounded text-center text-[10px] sm:text-xs font-bold py-0.5 transition-all duration-300 ${
                    calledSet.has(num)
                      ? "bg-gradient-to-r from-bingo-green to-green-700 text-white scale-100"
                      : "text-gray-700 opacity-40"
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Win Celebration Overlay ──────────────────────────────────────

function WinOverlay({
  winners,
  prizePool,
  onClose,
}: {
  winners: SerializedGame["winners"];
  prizePool: number;
  onClose: () => void;
}) {
  return (
    <div className="win-overlay" onClick={onClose}>
      <div className="win-card" onClick={(e) => e.stopPropagation()}>
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-4xl font-black mb-2">YOU WIN!</h2>
        <p className="text-xl opacity-80 mb-6">
          {winners[0]?.winResult.type === "full-house"
            ? "Full House!"
            : `${winners[0]?.winResult.type?.charAt(0).toUpperCase()}${winners[0]?.winResult.type?.slice(1)}!`}
          {" "}
          <span className="text-lg opacity-60">({winners[0]?.winResult.details})</span>
        </p>
        <div className="text-5xl font-black mb-8">
          ${prizePool.toFixed(2)}
        </div>
        <div className="flex gap-4 justify-center">
          <button onClick={onClose} className="bg-black/20 hover:bg-black/30 text-white font-bold py-3 px-8 rounded-xl transition-all">
            Continue
          </button>
        </div>
      </div>
      {/* Simple confetti particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute text-2xl pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-5%",
            animation: `confetti-fall ${2 + Math.random() * 3}s linear ${Math.random() * 2}s infinite`,
            color: ["#c9a227", "#c62828", "#388e3c", "#fff8e7", "#f0d060"][i % 5],
          }}
        >
          {["🎉", "⭐", "✨", "💫", "🎊"][i % 5]}
        </div>
      ))}
    </div>
  );
}

// ─── Main Game Page ───────────────────────────────────────────────

function GamePage() {
  const { gameType } = useParams({ from: "/game/$gameType" });
  const navigate = useNavigate();
  const type = gameType as GameType;
  const config = GAME_CONFIGS[type];

  const [pageState, setPageState] = useState<PageState>("lobby");
  const [game, setGame] = useState<SerializedGame | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<SerializedPlayer | null>(null);

  // Lobby state
  const [username, setUsername] = useState("");
  const [cardCount, setCardCount] = useState(3);
  const [joining, setJoining] = useState(false);
  const [walletBalance, setWalletBalance] = useState(getBalance());
  const [error, setError] = useState("");

  // Playing state
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [lastCalledNumber, setLastCalledNumber] = useState<number | null>(null);
  const [showWin, setShowWin] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameIdRef = useRef<string | null>(null);
  const playerIdRef = useRef<string | null>(null);

  // Validate game type
  if (!config) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-400">Invalid Game Type</h1>
          <p className="mt-4 text-gray-400">"{type}" is not a valid game tier.</p>
          <a href="/" className="btn-primary mt-6 inline-block">Back to Home</a>
        </div>
      </div>
    );
  }

  // ─── Join Game ─────────────────────────────────────────────────────

  const handleJoinGame = useCallback(async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    setJoining(true);
    setError("");

    try {
      // 1. Create game
      const createdGame = await apiCreateGame({ data: { type } });
      gameIdRef.current = createdGame.id;

      // 2. Join game with custom card count
      const playerId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      playerIdRef.current = playerId;
      const joinResult = await apiJoinGame({
        data: { gameId: createdGame.id, playerId, username: username.trim(), cardCount },
      });

      setCurrentPlayer(joinResult.player as unknown as SerializedPlayer);
      setGame(joinResult.game as unknown as SerializedGame);

      // 3. Start game
      const startedGame = await apiStartGame({ data: { gameId: createdGame.id } });
      setGame(startedGame as unknown as SerializedGame);
      setPageState("playing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game");
    } finally {
      setJoining(false);
    }
  }, [username, cardCount, type]);

  // ─── Call Next Number ───────────────────────────────────────────────

  const callNextNumber = useCallback(async () => {
    if (!gameIdRef.current) return;

    try {
      const result = await apiNextNumber({ data: { gameId: gameIdRef.current } });
      setGame(result.game as unknown as SerializedGame);
      setLastCalledNumber(result.number as number | null);

      if (result.number !== null) {
        setCurrentNumber(result.number);
        // Clear "current" highlight after 1.5s
        setTimeout(() => setCurrentNumber(null), 1500);
      }

      // Check for winners - find if current player won
      if (result.winners && result.winners.length > 0) {
        const myWin = result.winners.find(
          (w: any) => w.playerId === playerIdRef.current
        );
        if (myWin) {
          setShowWin(true);
        }
      }

      if (result.gameOver) {
        setPageState("finished");
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } catch (err) {
      console.error("Failed to call number:", err);
    }
  }, []);

  // ─── Auto-advance timer ─────────────────────────────────────────────

  useEffect(() => {
    if (pageState === "playing") {
      // Call first number immediately
      callNextNumber();

      // Then every 3 seconds
      timerRef.current = setInterval(callNextNumber, 3000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pageState, callNextNumber]);

  // Update currentPlayer when game updates
  useEffect(() => {
    if (game && playerIdRef.current) {
      const me = game.players.find((p) => p.id === playerIdRef.current);
      if (me) setCurrentPlayer(me);
    }
  }, [game]);

  // ─── Called set from game state ────────────────────────────────────

  const calledNumbers = game?.callerState?.calledNumbers ?? [];
  const calledSet = new Set(calledNumbers);

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className={`min-h-dvh bg-gradient-to-b from-bingo-dark ${tierGradients[type]} pb-8`}>
      {/* Header */}
      <div className={`border-b ${tierAccent[type]} bg-bingo-dark/80 backdrop-blur-sm`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-400 hover:text-white text-sm">&larr; Lobby</a>
            <span className="text-gray-600">|</span>
            <span className={`font-bold ${tierColors[type]}`}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {game && (
              <>
                <span className="text-gray-400">
                  Called: <span className="text-white font-bold">{calledNumbers.length}/75</span>
                </span>
                <span className="text-gray-400">
                  Prize: <span className="text-bingo-gold font-bold">${config.prizePool.toFixed(2)}</span>
                </span>
                <span className="text-gray-400">
                  Entry: <span className="text-white font-bold">${config.entryFee.toFixed(2)}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pre-game Lobby */}
      {pageState === "lobby" && (
        <div className="mx-auto max-w-lg px-4 pt-20">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <span className="text-5xl">
              {type === "mini" ? "🎯" : type === "major" ? "💎" : "👑"}
            </span>
            <h2 className={`mt-4 text-3xl font-bold ${tierColors[type]}`}>
              {config.label}
            </h2>
            <p className="mt-2 text-gray-400">
              Entry: <span className="text-bingo-gold font-bold">${config.entryFee.toFixed(2)}</span>
              {" | "}Prize: <span className="text-bingo-gold font-bold">${config.prizePool.toFixed(2)}</span>
            </p>

            <div className="mt-8 space-y-5">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Your Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={20}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-bingo-gold focus:outline-none focus:ring-1 focus:ring-bingo-gold/50"
                  onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
                />
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Number of Cards
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCardCount(n)}
                      className={`flex-1 rounded-xl py-3 text-center font-bold transition-all ${
                        cardCount === n
                          ? "bg-bingo-gold text-bingo-dark"
                          : "border border-white/10 text-gray-400 hover:border-bingo-gold/50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-600">
                  ${(config.entryFee * cardCount).toFixed(2)} total for {cardCount} card{cardCount > 1 ? "s" : ""}
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-900/30 border border-red-500/30 px-4 py-2 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleJoinGame}
                disabled={joining}
                className="btn-primary w-full text-lg py-3 disabled:opacity-50"
              >
                {joining ? "Joining..." : "Join Game &rarr;"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Game */}
      {pageState === "playing" && game && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Main Area — Cards + Caller */}
            <div>
              {/* Current Number Display */}
              <div className="mb-6 text-center">
                {lastCalledNumber !== null ? (
                  <div className="inline-flex flex-col items-center">
                    <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                      Last Number
                    </span>
                    <div className={`number-ball number-ball-current animate-pulse-gold ${
                      currentNumber === lastCalledNumber ? "scale-110" : ""
                    }`}>
                      <div className="text-center leading-tight">
                        <span className="block text-xs font-medium opacity-70">
                          {getNumberColumn(lastCalledNumber)}
                        </span>
                        <span className="block">{lastCalledNumber}</span>
                      </div>
                    </div>
                    <span className={`mt-2 text-sm font-bold ${getNumberColor(lastCalledNumber)}`}>
                      {getNumberColumn(lastCalledNumber)}-{lastCalledNumber}
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-600 text-lg py-6">Drawing first number...</div>
                )}
              </div>

              {/* Bingo Cards Grid */}
              {currentPlayer && (
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                  {currentPlayer.cards.map((card) => (
                    <BingoCardDisplay key={card.id} card={card} />
                  ))}
                </div>
              )}

              {/* Manual Call Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={callNextNumber}
                  className="btn-secondary text-sm"
                  disabled={pageState !== "playing"}
                >
                  Call Next Number
                </button>
              </div>
            </div>

            {/* Sidebar — Called Numbers Board */}
            <div>
              <CalledNumbersBoard numbers={calledNumbers} />

              {/* Player Info */}
              {currentPlayer && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Your Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Player</span>
                      <span className="text-white font-medium">{currentPlayer.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cards</span>
                      <span className="text-white font-medium">{currentPlayer.cardCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium ${currentPlayer.hasWon ? "text-bingo-gold" : "text-green-400"}`}>
                        {currentPlayer.hasWon ? "Winner! 🎉" : "Playing"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Called</span>
                      <span className="text-white font-medium">{calledNumbers.length} / 75</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Finished State */}
      {pageState === "finished" && (
        <div className="mx-auto max-w-lg px-4 pt-20 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <span className="text-6xl">🏁</span>
            <h2 className="mt-4 text-3xl font-bold text-white">Game Over</h2>
            <p className="mt-2 text-gray-400">
              {calledNumbers.length} numbers were called.
            </p>
            {currentPlayer?.hasWon && (
              <p className="mt-2 text-bingo-gold font-bold text-xl">You won! 🎉</p>
            )}
            {!currentPlayer?.hasWon && (
              <p className="mt-2 text-gray-500">Better luck next time!</p>
            )}
            <div className="mt-8 flex gap-4 justify-center">
              <a href={`/game/${type}`} className="btn-primary">
                Play Again
              </a>
              <a href="/" className="btn-ghost">
                Lobby
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Win Overlay */}
      {showWin && game && (
        <WinOverlay
          winners={game.winners}
          prizePool={config.prizePool}
          onClose={() => setShowWin(false)}
        />
      )}
    </div>
  );
}
