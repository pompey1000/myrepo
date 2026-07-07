import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { GAME_CONFIGS } from "../lib/gameState";
import type { GameType } from "../lib/gameState";

const getGameConfigs = createServerFn({ method: "GET" }).handler(async () => {
  return Object.entries(GAME_CONFIGS).map(([key, config]) => ({
    type: key as GameType,
    ...config,
  }));
});

export const Route = createFileRoute("/")({
  loader: () => getGameConfigs(),
  component: Home,
});

const tierIcons: Record<GameType, string> = {
  mini: "🎯",
  major: "💎",
  mega: "👑",
};

const tierGradients: Record<GameType, string> = {
  mini: "game-tier-card-mini",
  major: "game-tier-card-major",
  mega: "game-tier-card-mega",
};

const tierColors: Record<GameType, string> = {
  mini: "text-green-400",
  major: "text-yellow-400",
  mega: "text-red-400",
};

function Home() {
  const configs = Route.useLoaderData();

  return (
    <div className="min-h-dvh">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-bingo-dark via-red-950/30 to-bingo-dark px-4 pb-12 pt-20 sm:px-6 sm:pt-28">
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-bingo-gold/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-bingo-red/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-bingo-gold/10 px-4 py-1.5 text-sm text-bingo-gold">
            <span className="h-2 w-2 rounded-full bg-bingo-gold animate-pulse" />
            Live Games Running
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
            <span className="bg-gradient-to-r from-bingo-gold via-amber-400 to-bingo-gold-light bg-clip-text text-transparent">
              BingoJackpot
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
            Play classic bingo with multiple jackpot tiers. Buy your cards, daub your numbers,
            and win big across Mini, Major, and Mega games.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#games" className="btn-primary text-lg px-8 py-3">
              Play Now
            </a>
            <a href="#" className="btn-ghost text-lg px-8 py-3">
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Game Tiers Section */}
      <section id="games" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Choose Your <span className="text-bingo-gold">Game</span>
          </h2>
          <p className="mt-3 text-gray-400">Pick a tier and try your luck</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {configs.map((config) => (
            <a
              key={config.type}
              href={`/game/${config.type}`}
              className={`game-tier-card ${tierGradients[config.type]}`}
            >
              {/* Decorative top accent */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                config.type === 'mini' ? 'from-green-500 to-green-700' :
                config.type === 'major' ? 'from-yellow-500 to-yellow-700' :
                'from-red-500 to-red-700'
              }`} />

              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-4xl">{tierIcons[config.type]}</span>
                  <span className={`text-sm font-medium ${tierColors[config.type]}`}>
                    {config.type === 'mini' ? 'Quick Play' :
                     config.type === 'major' ? 'Popular' : 'High Roller'}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white">{config.label}</h3>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Entry Fee</span>
                    <span className="text-lg font-bold text-bingo-gold">
                      ${config.entryFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Prize Pool</span>
                    <span className={`text-lg font-bold ${
                      config.type === 'mega' ? 'text-red-400' : 'text-bingo-gold'
                    }`}>
                      ${config.prizePool.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Max Players</span>
                    <span className="text-white font-medium">{config.maxPlayers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Cards Per Player</span>
                    <span className="text-white font-medium">{config.cardsPerPlayer}</span>
                  </div>
                </div>

                <div className={`mt-8 w-full rounded-xl py-3 text-center font-bold transition-all ${
                  config.type === 'mini' ? 'bg-green-600 hover:bg-green-500 text-white' :
                  config.type === 'major' ? 'bg-yellow-600 hover:bg-yellow-500 text-black' :
                  'bg-red-600 hover:bg-red-500 text-white'
                }`}>
                  Play Now &rarr;
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-white/5 bg-bingo-dark/50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-bingo-gold/10 bg-white/5 p-6 text-center">
              <span className="text-3xl">🎲</span>
              <h3 className="mt-4 text-lg font-bold text-white">Auto-Daub</h3>
              <p className="mt-2 text-sm text-gray-400">
                Sit back and relax — numbers are automatically marked on your cards as they're called.
              </p>
            </div>
            <div className="rounded-xl border border-bingo-gold/10 bg-white/5 p-6 text-center">
              <span className="text-3xl">⚡</span>
              <h3 className="mt-4 text-lg font-bold text-white">Instant Wins</h3>
              <p className="mt-2 text-sm text-gray-400">
                Win detection runs after every number call. No waiting — know instantly if you've won.
              </p>
            </div>
            <div className="rounded-xl border border-bingo-gold/10 bg-white/5 p-6 text-center">
              <span className="text-3xl">🏆</span>
              <h3 className="mt-4 text-lg font-bold text-white">Jackpot Tiers</h3>
              <p className="mt-2 text-sm text-gray-400">
                Three tiers of play from quick Mini games to the big Mega jackpot. Something for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-8 text-center text-sm text-gray-600">
        <p>BingoJackpot &mdash; Play responsibly. Must be 18+ to play.</p>
      </footer>
    </div>
  );
}
