import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BabyEvent, EventDetail } from "@/types";

const COLLECTION = "events";

// ─── Converters ────────────────────────────────────────────────────────────────

function toEvent(snap: QueryDocumentSnapshot<DocumentData>): BabyEvent {
  const d = snap.data();
  return {
    id: snap.id,
    date: d.date,
    startTime: (d.startTime as Timestamp).toDate(),
    endTime: d.endTime ? (d.endTime as Timestamp).toDate() : undefined,
    detail: d.detail as EventDetail,
    notes: d.notes ?? undefined,
    createdAt: (d.createdAt as Timestamp).toDate(),
    updatedAt: (d.updatedAt as Timestamp).toDate(),
  };
}

// ─── Queries ───────────────────────────────────────────────────────────────────

/** Fetch all events for a given day (YYYY-MM-DD). */
export async function getEventsForDay(date: string): Promise<BabyEvent[]> {
  const q = query(
    collection(db, COLLECTION),
    where("date", "==", date),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(toEvent);
}

/** Fetch events across a date range (inclusive). */
export async function getEventsForRange(
  from: string,
  to: string
): Promise<BabyEvent[]> {
  const q = query(
    collection(db, COLLECTION),
    where("date", ">=", from),
    where("date", "<=", to),
    orderBy("date", "asc"),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(toEvent);
}

/** Fetch the currently active sleep event, if any. */
export async function getActiveSleep(): Promise<BabyEvent | null> {
  const q = query(
    collection(db, COLLECTION),
    where("detail.type", "==", "sleep"),
    where("detail.isActive", "==", true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return toEvent(snap.docs[0]);
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export async function addEvent(
  detail: EventDetail,
  opts?: { notes?: string; startTime?: Date }
): Promise<string> {
  const now = new Date();
  const startTime = opts?.startTime ?? now;
  const date = startTime.toISOString().slice(0, 10);

  const ref = await addDoc(collection(db, COLLECTION), {
    date,
    startTime: Timestamp.fromDate(startTime),
    detail,
    notes: opts?.notes ?? null,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
  return ref.id;
}

export async function updateEvent(
  id: string,
  patch: {
    detail?: Partial<EventDetail>;
    notes?: string;
    startTime?: Date;
    endTime?: Date;
  }
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(`Event ${id} not found`);

  const existing = snap.data();
  const updates: Record<string, unknown> = {
    updatedAt: Timestamp.fromDate(new Date()),
  };

  if (patch.detail) {
    updates.detail = { ...existing.detail, ...patch.detail };
  }
  if (patch.notes !== undefined) updates.notes = patch.notes;
  if (patch.startTime) {
    updates.startTime = Timestamp.fromDate(patch.startTime);
    updates.date = patch.startTime.toISOString().slice(0, 10);
  }
  if (patch.endTime) updates.endTime = Timestamp.fromDate(patch.endTime);

  await updateDoc(ref, updates);
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Stop an active sleep: sets isActive=false and records endTime. */
export async function stopSleep(id: string): Promise<void> {
  const now = new Date();
  await updateDoc(doc(db, COLLECTION, id), {
    "detail.isActive": false,
    endTime: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
}
