import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, Timestamp,
  DocumentData, QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppEvent, AppEventType, dateKey } from "@/lib/sampleData";

const COL = "events";

function toAppEvent(snap: QueryDocumentSnapshot<DocumentData>): AppEvent {
  const d = snap.data();
  return {
    id: snap.id,
    type: d.type as AppEventType,
    start: (d.start as Timestamp).toDate(),
    end: d.end ? (d.end as Timestamp).toDate() : null,
    dur: d.dur ?? 0,
    data: d.data ?? {},
  };
}

export function subscribeToHistory(
  fromDate: Date,
  onUpdate: (history: Record<string, AppEvent[]>) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(
    collection(db, COL),
    where("start", ">=", Timestamp.fromDate(fromDate)),
    orderBy("start", "asc"),
  );
  return onSnapshot(
    q,
    snap => {
      console.log(`[Charlie Firestore] events snapshot: ${snap.docs.length} docs`);
      const history: Record<string, AppEvent[]> = {};
      snap.docs.forEach(d => {
        try {
          const ev = toAppEvent(d);
          const key = d.data().date as string;
          if (!history[key]) history[key] = [];
          history[key].push(ev);
        } catch (e) {
          console.warn('[Charlie Firestore] skipping malformed event doc', d.id, e);
        }
      });
      onUpdate(history);
    },
    err => {
      console.error('[Charlie Firestore] events subscription error:', err.message);
      onError?.(err);
    },
  );
}

export async function fsAddEvent(
  ev: Omit<AppEvent, "id">,
  date: string,
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    type: ev.type,
    date,
    start: Timestamp.fromDate(ev.start),
    end: ev.end ? Timestamp.fromDate(ev.end) : null,
    dur: ev.dur,
    data: ev.data,
    createdAt: Timestamp.fromDate(new Date()),
  });
  return ref.id;
}

export async function fsUpdateEvent(
  id: string,
  patch: { start?: Date; end?: Date | null; dur?: number; data?: Record<string, unknown>; date?: string },
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: Timestamp.fromDate(new Date()) };
  if (patch.start) updates.start = Timestamp.fromDate(patch.start);
  if (patch.end !== undefined) updates.end = patch.end ? Timestamp.fromDate(patch.end) : null;
  if (patch.dur !== undefined) updates.dur = patch.dur;
  if (patch.data) updates.data = patch.data;
  if (patch.date) updates.date = patch.date;
  await updateDoc(doc(db, COL, id), updates);
}

export async function fsDeleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
