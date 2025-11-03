import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { mkdirSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DB_FILE = join(DATA_DIR, 'db.json');

const defaultData = {
  users: [],
  sessions: [],
  swipes: [],
  matches: [],
  subscriptions: [],
};

let db;

const clone = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

export const ensureDatabase = () => {
  if (!db) {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }

    const adapter = new JSONFile(DB_FILE);
    db = new Low(adapter, defaultData);
  }

  return db;
};

export const getDb = async () => {
  ensureDatabase();
  await db.read();
  db.data ||= clone(defaultData);
  return db;
};

export const persistDb = async () => {
  if (!db) {
    throw new Error('Database not initialised');
  }
  await db.write();
};
