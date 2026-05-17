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
  void fromDate; // window filter removed — dataset is small enough to load fully
  const q = query(collection(db, COL), where("trackerId", "==", LEGACY_SCOPE));
  return onSnapshot(
    q,
    snap => {
      const history: Record<string, AppEvent[]> = {};
      let minMs = Infinity;
      let maxMs = -Infinity;
      let kept = 0;
      snap.docs.forEach(docSnap => {
        try {
          const ev = legacyToAppEvent(docSnap.id, docSnap.data());
          if (!ev) return; // growth or unknown type
          const ms = ev.start.getTime();
          if (ms < minMs) minMs = ms;
          if (ms > maxMs) maxMs = ms;
          kept++;
          const key = dateKey(ev.start);
          if (!history[key]) history[key] = [];
          history[key].push(ev);
        } catch (e) {
          console.warn('[Charlie Firestore] skipping malformed event doc', docSnap.id, e);
        }
      });
      Object.values(history).forEach(list => list.sort((a, b) => a.start.getTime() - b.start.getTime()));
      console.log(
        `[Charlie Firestore] events: ${snap.docs.length} docs → ${kept} kept across ${Object.keys(history).length} days |`,
        kept ? `range ${new Date(minMs).toISOString().slice(0, 10)} → ${new Date(maxMs).toISOString().slice(0, 10)}` : 'none',
        `| app TODAY ${new Date().toISOString().slice(0, 10)}`,
      );
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
