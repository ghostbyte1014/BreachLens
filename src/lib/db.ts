import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { BreachItem, PasteItem, PasswordTag, CheckHistoryItem, ChecklistItem, DatabaseExportPayload } from '../types';

interface BreachLensDB extends DBSchema {
  breaches: { key: string; value: BreachItem };
  pastes: { key: string; value: PasteItem };
  passwordTags: { key: string; value: PasswordTag };
  checkHistory: { key: string; value: CheckHistoryItem };
  checklist: { key: string; value: ChecklistItem };
}

const DB_NAME = 'breachlens';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<BreachLensDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<BreachLensDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BreachLensDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('breaches', { keyPath: 'id' });
          db.createObjectStore('passwordTags', { keyPath: 'breachId' });
          db.createObjectStore('checkHistory', { keyPath: 'email' });
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('pastes')) {
            db.createObjectStore('pastes', { keyPath: 'id' });
          }
        }
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('checklist')) {
            db.createObjectStore('checklist', { keyPath: 'id' });
          }
        }
      },
    });
  }
  return dbPromise;
}

// Breaches
export async function getAllBreaches(): Promise<BreachItem[]> {
  const db = await getDB();
  return db.getAll('breaches');
}
export async function putBreach(breach: BreachItem): Promise<string> {
  const db = await getDB();
  return db.put('breaches', breach);
}
export async function putBreaches(breaches: BreachItem[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('breaches', 'readwrite');
  for (const b of breaches) await tx.store.put(b);
  await tx.done;
}

// Pastes
export async function getAllPastes(): Promise<PasteItem[]> {
  const db = await getDB();
  return db.getAll('pastes');
}
export async function putPastes(pastes: PasteItem[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('pastes', 'readwrite');
  for (const p of pastes) await tx.store.put(p);
  await tx.done;
}

// Password Tags
export async function getAllPasswordTags(): Promise<PasswordTag[]> {
  const db = await getDB();
  return db.getAll('passwordTags');
}
export async function putPasswordTag(tag: PasswordTag): Promise<string> {
  const db = await getDB();
  return db.put('passwordTags', tag);
}
export async function deletePasswordTag(breachId: string): Promise<void> {
  const db = await getDB();
  return db.delete('passwordTags', breachId);
}

// Check History
export async function getAllCheckHistory(): Promise<CheckHistoryItem[]> {
  const db = await getDB();
  return db.getAll('checkHistory');
}
export async function getCheckHistoryForEmail(email: string): Promise<CheckHistoryItem | undefined> {
  const db = await getDB();
  return db.get('checkHistory', email.toLowerCase());
}
export async function putCheckHistory(item: CheckHistoryItem): Promise<string> {
  const db = await getDB();
  return db.put('checkHistory', { ...item, email: item.email.toLowerCase() });
}

// Checklist
export async function getAllChecklist(): Promise<ChecklistItem[]> {
  const db = await getDB();
  return db.getAll('checklist');
}
export async function putChecklistItem(item: ChecklistItem): Promise<string> {
  const db = await getDB();
  return db.put('checklist', item);
}
export async function putChecklistItems(items: ChecklistItem[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('checklist', 'readwrite');
  for (const i of items) await tx.store.put(i);
  await tx.done;
}

// Clear & Export / Import
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['breaches', 'pastes', 'passwordTags', 'checkHistory', 'checklist'], 'readwrite');
  await tx.objectStore('breaches').clear();
  await tx.objectStore('pastes').clear();
  await tx.objectStore('passwordTags').clear();
  await tx.objectStore('checkHistory').clear();
  await tx.objectStore('checklist').clear();
  await tx.done;
}

export async function exportDatabaseJSON(): Promise<DatabaseExportPayload> {
  return {
    exportedAt: new Date().toISOString(),
    breaches: await getAllBreaches(),
    pastes: await getAllPastes(),
    passwordTags: await getAllPasswordTags(),
    checkHistory: await getAllCheckHistory(),
    checklist: await getAllChecklist()
  };
}

export async function importDatabaseJSON(payload: DatabaseExportPayload): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['breaches', 'pastes', 'passwordTags', 'checkHistory', 'checklist'], 'readwrite');
  if (Array.isArray(payload.breaches)) for (const b of payload.breaches) await tx.objectStore('breaches').put(b);
  if (Array.isArray(payload.pastes)) for (const p of payload.pastes) await tx.objectStore('pastes').put(p);
  if (Array.isArray(payload.passwordTags)) for (const t of payload.passwordTags) await tx.objectStore('passwordTags').put(t);
  if (Array.isArray(payload.checkHistory)) for (const h of payload.checkHistory) await tx.objectStore('checkHistory').put(h);
  if (Array.isArray(payload.checklist)) for (const c of payload.checklist) await tx.objectStore('checklist').put(c);
  await tx.done;
}
