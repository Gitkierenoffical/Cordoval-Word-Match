export type WordPair = readonly [string, string];

export const STARTER_DECK: readonly WordPair[] = [
  ['salt', 'pepper'],
  ['cup', 'saucer'],
  ['bread', 'butter'],
  ['sun', 'moon'],
  ['knife', 'fork'],
  ['fish', 'chips'],
  ['rain', 'umbrella'],
  ['lock', 'key'],
  ['bat', 'ball'],
  ['needle', 'thread'],
  ['pen', 'paper'],
  ['bucket', 'spade'],
  ['tea', 'biscuit'],
  ['shoe', 'sock'],
  ['bee', 'honey'],
  ['cloud', 'sky'],
  ['book', 'page'],
  ['scone', 'cream'],
  ['boat', 'harbour'],
  ['kettle', 'teapot'],
  ['garden', 'flower'],
  ['castle', 'king'],
  ['wellies', 'puddle'],
  ['toast', 'jam'],
];

export const PAIRS_PER_GAME = 8;

export interface Card {
  id: number;
  pairId: number;
  word: string;
}

export function buildBoard(random: () => number, pairsPerGame = PAIRS_PER_GAME): Card[] {
  const chosen = shuffle(STARTER_DECK.map((_, i) => i), random).slice(0, pairsPerGame);
  const cards = chosen.flatMap((pairId) =>
    STARTER_DECK[pairId].map((word) => ({ pairId, word })),
  );
  return shuffle(cards, random).map((card, id) => ({ ...card, id }));
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
