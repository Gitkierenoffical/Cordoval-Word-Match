const PREFIX = 'cordoval-word-match:';

export interface Best {
  moves: number | null;
  timeMs: number | null;
}

export interface Bests {
  free: Best;
  daily: Best & { date: string | null };
}

const EMPTY_BESTS: Bests = {
  free: { moves: null, timeMs: null },
  daily: { date: null, moves: null, timeMs: null },
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private browsing, quota); the game still works without it.
  }
}

export function loadBests(): Bests {
  const stored = read<Bests>('bests', EMPTY_BESTS);
  return {
    free: { ...EMPTY_BESTS.free, ...stored.free },
    daily: { ...EMPTY_BESTS.daily, ...stored.daily },
  };
}

export function saveBests(bests: Bests): void {
  write('bests', bests);
}

export function clearBests(): Bests {
  write('bests', EMPTY_BESTS);
  return EMPTY_BESTS;
}

export interface Settings {
  sound: boolean;
}

export function loadSettings(): Settings {
  return read<Settings>('settings', { sound: false });
}

export function saveSettings(settings: Settings): void {
  write('settings', settings);
}

export function mergeBest(current: Best, moves: number, timeMs: number): { best: Best; newMoves: boolean; newTime: boolean } {
  const newMoves = current.moves === null || moves < current.moves;
  const newTime = current.timeMs === null || timeMs < current.timeMs;
  return {
    best: {
      moves: newMoves ? moves : current.moves,
      timeMs: newTime ? timeMs : current.timeMs,
    },
    newMoves,
    newTime,
  };
}
