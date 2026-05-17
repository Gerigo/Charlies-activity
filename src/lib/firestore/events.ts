import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { AppEvent, AppEventType, dateKey } from "@/lib/sampleData";
import { LEGACY_SCOPE, legacyToAppEvent, appEventToLegacy } from "./legacyAdapter";

const COL = "events";

export function subscribeToHistory(
  fromDate: Date,
  onUpdate: (history: Record<string, AppEvent[]>) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COL), where("trackerId", "==", LEGACY_SCOPE));
  const fromMs = fromDate.getTime();
  return onSnapshot(
    q,
    snap => {
      console.log(`[Charlie Firestore] events snapshot: ${snap.docs.length} docs`);
      const history: Record<string, AppEvent[]> = {};
      snap.docs.forEach(docSnap => {
        try {
          const raw = docSnap.data();
          const ev = legacyToAppEvent(docSnap.id, raw);
          if (!ev) return; // growth or unknown type
          if (ev.start.getTime() < fromMs) return; // outside the window
          const key = dateKey(ev.start);
          if (!history[key]) history[key] = [];
          history[key].push(ev);
        } catch (e) {
          console.warn('[Charlie Firestore] skipping malformed event doc', docSnap.id, e);
        }
      });
      Object.values(history).forEach(list => list.sort((a, b) => a.start.getTime() - b.start.getTime()));
      onUpdate(history);
    },
    err => {
      console.error('[Charlie Firestore] events subscription error:', err.message);
      onError?.(err);
    },
  );
}

function currentUid(): string {
  return auth.currentUser?.uid ?? 'unknown';
}

export async function fsAddEvent(
  ev: Omit<AppEvent, "id">,
  _date: string,
): Promise<string> {
  const ref = await addDoc(collection(db, COL), appEventToLegacy(ev, currentUid()));
  return ref.id;
}

export async function fsUpdateEvent(
  id: string,
  patch: {
    start?: Date; end?: Date | null; dur?: number;
    data?: AppEvent["data"]; date?: string; type?: AppEventType;
  },
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  if (patch.start) updates.startTime = patch.start.getTime();
  if (patch.end !== undefined) updates.endTime = patch.end ? patch.end.getTime() : null;
  if (patch.data && patch.type && patch.start) {
    const legacy = appEventToLegacy(
      { type: patch.type, start: patch.start, end: patch.end ?? null, data: patch.data },
      currentUid(),
    );
    updates.details = legacy.details;
    updates.notes = legacy.notes;
  }
  await updateDoc(doc(db, COL, id), updates);
}

export async function fsDeleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
