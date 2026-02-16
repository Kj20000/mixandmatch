import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface WordImagePair {
  id: string;
  wordEn: string;
  wordHi?: string;
  imageUrl: string; // base64 data URL for custom, or path for defaults
  audioUrl?: string; // base64 data URL for recorded audio
  isDefault?: boolean;
}

export interface AppSettings {
  pairsCount: number;
  soundEnabled: boolean;
}

interface MatchAppDB extends DBSchema {
  pairs: {
    key: string;
    value: WordImagePair;
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<MatchAppDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MatchAppDB>('word-image-match', 1, {
      upgrade(db) {
        db.createObjectStore('pairs', { keyPath: 'id' });
        db.createObjectStore('settings');
      },
    });
  }
  return dbPromise;
}

// Default pairs shipped with the app
const DEFAULT_PAIRS: WordImagePair[] = [
  { id: 'default-apple', wordEn: 'Apple', wordHi: 'सेब', imageUrl: '/images/apple.svg', isDefault: true },
  { id: 'default-cat', wordEn: 'Cat', wordHi: 'बिल्ली', imageUrl: '/images/cat.svg', isDefault: true },
  { id: 'default-sun', wordEn: 'Sun', wordHi: 'सूरज', imageUrl: '/images/sun.svg', isDefault: true },
  { id: 'default-ball', wordEn: 'Ball', wordHi: 'गेंद', imageUrl: '/images/ball.svg', isDefault: true },
  { id: 'default-fish', wordEn: 'Fish', wordHi: 'मछली', imageUrl: '/images/fish.svg', isDefault: true },
  { id: 'default-star', wordEn: 'Star', wordHi: 'तारा', imageUrl: '/images/star.svg', isDefault: true },
];

export async function initializeDefaults() {
  const db = await getDB();
  const existing = await db.getAll('pairs');
  if (existing.length === 0) {
    const tx = db.transaction('pairs', 'readwrite');
    for (const pair of DEFAULT_PAIRS) {
      await tx.store.put(pair);
    }
    await tx.done;
  }
  const settings = await db.get('settings', 'app');
  if (!settings) {
    await db.put('settings', { pairsCount: 3, soundEnabled: true }, 'app');
  }
}

export async function getAllPairs(): Promise<WordImagePair[]> {
  const db = await getDB();
  return db.getAll('pairs');
}

export async function addPair(pair: WordImagePair) {
  const db = await getDB();
  await db.put('pairs', pair);
}

export async function deletePair(id: string) {
  const db = await getDB();
  await db.delete('pairs', id);
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const s = await db.get('settings', 'app');
  return s || { pairsCount: 3, soundEnabled: true };
}

export async function updateSettings(settings: Partial<AppSettings>) {
  const db = await getDB();
  const current = await getSettings();
  await db.put('settings', { ...current, ...settings }, 'app');
}
