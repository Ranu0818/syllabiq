import { openDB } from 'idb';

export interface OfflineStudyPack {
  id: string;
  user_id?: string;
  title: string;
  subject?: string;
  grade?: string;
  content_type?: string;
  source_url?: string | null;
  notes?: string;
  flashcards?: any[];
  quizzes?: any[];
  is_offline?: boolean;
  suggested_questions?: any[];
  created_at?: string;
  updated_at?: string;
}

const DB_NAME = 'syllabiq-db';
const STORE = 'study_packs';

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('is_offline', 'is_offline');
      }
    }
  });
}

export async function saveStudyPackToIDB(pack: OfflineStudyPack) {
  const db = await getDB();
  await db.put(STORE, pack);
  return pack.id;
}

export async function getAllStudyPacksFromIDB() {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function getUnsyncedPacks() {
  const db = await getDB();
  return db.getAllFromIndex(STORE, 'is_offline', true as any);
}