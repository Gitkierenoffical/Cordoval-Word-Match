import { useCallback, useEffect, useRef, useState } from 'react';
import { buildBoard, PAIRS_PER_GAME, type Card } from './deck';
import { formatLondonDate, hashString, londonDateKey, mulberry32 } from './random';
import {
  clearBests,
  loadBests,
  loadSettings,
  mergeBest,
  saveBests,
  saveSettings,
  type Best,
  type Bests,
} from './storage';
import { BuildHouseDailyAd } from './BuildHouseDailyAd';
import { click } from './sound';

type Mode = 'free' | 'daily';

const MISMATCH_DELAY_MS = 900;

interface Result {
  moves: number;
  timeMs: number;
  newMoves: boolean;
  newTime: boolean;
}

function newBoard(mode: Mode, dateKey: string): Card[] {
  const seed = mode === 'daily' ? hashString(`word-match:daily:${dateKey}`) : (Math.random() * 2 ** 32) >>> 0;
  return buildBoard(mulberry32(seed));
}

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function bestFor(bests: Bests, mode: Mode, dateKey: string): Best {
  if (mode === 'free') return bests.free;
  return bests.daily.date === dateKey ? bests.daily : { moves: null, timeMs: null };
}

export default function App() {
  const [mode, setMode] = useState<Mode>('free');
  const [dateKey, setDateKey] = useState(() => londonDateKey());
  const [cards, setCards] = useState<Card[]>(() => newBoard('free', londonDateKey()));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(() => new Set());
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<Result | null>(null);
  const [bests, setBests] = useState<Bests>(() => loadBests());
  const [sound, setSound] = useState(() => loadSettings().sound);
  const [gameKey, setGameKey] = useState(0);

  const mismatchTimer = useRef<number | undefined>(undefined);
  const playAgainRef = useRef<HTMLButtonElement>(null);

  const elapsed = result ? result.timeMs : startedAt ? now - startedAt : 0;
  const best = bestFor(bests, mode, dateKey);

  const startGame = useCallback((nextMode: Mode) => {
    window.clearTimeout(mismatchTimer.current);
    const key = londonDateKey();
    setDateKey(key);
    setMode(nextMode);
    setCards(newBoard(nextMode, key));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setStartedAt(null);
    setResult(null);
    setGameKey((k) => k + 1);
  }, []);

  useEffect(() => () => window.clearTimeout(mismatchTimer.current), []);

  useEffect(() => {
    if (startedAt === null || result) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [startedAt, result]);

  useEffect(() => {
    if (result) playAgainRef.current?.focus();
  }, [result]);

  const finish = (finalMoves: number, start: number) => {
    const timeMs = Date.now() - start;
    const current = bestFor(bests, mode, dateKey);
    const merged = mergeBest(current, finalMoves, timeMs);
    const nextBests: Bests =
      mode === 'free'
        ? { ...bests, free: merged.best }
        : { ...bests, daily: { ...merged.best, date: dateKey } };
    setBests(nextBests);
    saveBests(nextBests);
    setResult({ moves: finalMoves, timeMs, newMoves: merged.newMoves, newTime: merged.newTime });
  };

  const flip = (card: Card) => {
    if (result || flipped.length >= 2 || flipped.includes(card.id) || matched.has(card.pairId)) return;

    const start = startedAt ?? Date.now();
    if (startedAt === null) {
      setStartedAt(start);
      setNow(start);
    }
    if (sound) click(flipped.length === 0 ? 620 : 740);

    const nextFlipped = [...flipped, card.id];
    if (nextFlipped.length < 2) {
      setFlipped(nextFlipped);
      return;
    }

    const nextMoves = moves + 1;
    setMoves(nextMoves);
    const first = cards.find((c) => c.id === nextFlipped[0])!;

    if (first.pairId === card.pairId) {
      const nextMatched = new Set(matched).add(card.pairId);
      setMatched(nextMatched);
      setFlipped([]);
      if (sound) window.setTimeout(() => click(990), 90);
      if (nextMatched.size === cards.length / 2) finish(nextMoves, start);
    } else {
      setFlipped(nextFlipped);
      mismatchTimer.current = window.setTimeout(() => setFlipped([]), MISMATCH_DELAY_MS);
    }
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    saveSettings({ sound: next });
    if (next) click();
  };

  const resetBests = () => {
    if (window.confirm('Clear your best scores on this device?')) setBests(clearBests());
  };

  return (
    <div className="app">
      <header className="header">
        <img className="logo" src="/logos/word-match.svg" alt="" width={44} height={44} />
        <div>
          <h1>Word Match</h1>
          <p className="tagline">Flip cards to match word pairs.</p>
        </div>
      </header>

      <main className="main">
        <div className="modes" role="tablist" aria-label="Game mode">
          <button
            role="tab"
            aria-selected={mode === 'free'}
            className={mode === 'free' ? 'mode active' : 'mode'}
            onClick={() => startGame('free')}
          >
            Free play
          </button>
          <button
            role="tab"
            aria-selected={mode === 'daily'}
            className={mode === 'daily' ? 'mode active' : 'mode'}
            onClick={() => startGame('daily')}
          >
            Daily
          </button>
        </div>

        <p className="mode-note">
          {mode === 'daily'
            ? `Daily board for ${formatLondonDate(dateKey)}. Everyone gets the same layout today (UK time).`
            : `${PAIRS_PER_GAME} pairs, shuffled fresh every game.`}
        </p>

        <div className="stats" aria-live="polite">
          <div className="stat">
            <span className="stat-label">Moves</span>
            <span className="stat-value">{moves}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Time</span>
            <span className="stat-value">{formatTime(elapsed)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Pairs</span>
            <span className="stat-value">
              {matched.size}/{cards.length / 2}
            </span>
          </div>
          <button className="primary" onClick={() => startGame(mode)}>
            {mode === 'daily' ? 'Restart' : 'New game'}
          </button>
        </div>

        <div className="grid" key={gameKey}>
          {cards.map((card, index) => {
            const isMatched = matched.has(card.pairId);
            const isUp = isMatched || flipped.includes(card.id);
            const isMismatch = flipped.length === 2 && flipped.includes(card.id);
            return (
              <button
                key={card.id}
                className={`card${isUp ? ' up' : ''}${isMatched ? ' matched' : ''}${isMismatch ? ' mismatch' : ''}`}
                onClick={() => flip(card)}
                aria-label={isUp ? `${card.word}${isMatched ? ', matched' : ''}` : `Card ${index + 1}, face down`}
                aria-pressed={isUp}
              >
                <span className="card-inner">
                  <span className="card-face card-back" aria-hidden="true" />
                  <span className="card-face card-front" aria-hidden="true">
                    {card.word}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <section className="bests" aria-label="Best scores">
          <h2>{mode === 'daily' ? 'Best today' : 'Best scores'}</h2>
          <p>
            Fewest moves: <strong>{best.moves ?? 'none yet'}</strong>
            <span className="sep" aria-hidden="true">
              ·
            </span>
            Fastest time: <strong>{best.timeMs === null ? 'none yet' : formatTime(best.timeMs)}</strong>
          </p>
          <div className="small-actions">
            <button className="link" onClick={toggleSound} aria-pressed={sound}>
              Sound: {sound ? 'on' : 'off'}
            </button>
            <button className="link" onClick={resetBests}>
              Clear best scores
            </button>
          </div>
        </section>

        <p className="privacy">
          <strong>Private by design.</strong> No accounts, no cookies, no tracking. Your scores are saved in
          this browser only, and nothing leaves your device.
        </p>
      </main>

      <BuildHouseDailyAd />

      <footer className="footer">
        Part of <a href="https://www.cordoval.co.uk">Cordoval</a>. Local first software.
      </footer>

      {result && (
        <div className="overlay">
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="win-title">
            <h2 id="win-title">Well done!</h2>
            <p>
              You matched all {cards.length / 2} pairs{mode === 'daily' ? " on today's board" : ''}.
            </p>
            <div className="result-stats">
              <div>
                <span className="stat-label">Moves</span>
                <span className="stat-value">{result.moves}</span>
                {result.newMoves && <span className="badge">New best</span>}
              </div>
              <div>
                <span className="stat-label">Time</span>
                <span className="stat-value">{formatTime(result.timeMs)}</span>
                {result.newTime && <span className="badge">New best</span>}
              </div>
            </div>
            <div className="dialog-actions">
              <button ref={playAgainRef} className="primary" onClick={() => startGame(mode)}>
                {mode === 'daily' ? 'Play daily again' : 'Play again'}
              </button>
              {mode === 'daily' ? (
                <button className="secondary" onClick={() => startGame('free')}>
                  Try free play
                </button>
              ) : (
                <button className="secondary" onClick={() => startGame('daily')}>
                  Try the daily board
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
