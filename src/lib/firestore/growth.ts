import {
  collection, doc, addDoc, deleteDoc,
  onSnapshot, query, orderBy, Timestamp,
  DocumentData, QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GrowthPoint } from "@/lib/sampleData";

const COL = "growth";

function toGrowthPoint(snap: QueryDocumentSnapshot<DocumentData>): GrowthPoint {
  const d = snap.data();
  return {
    id: snap.id,
    date: (d.date as Timestamp).toDate(),
    day: d.day,
    poids: d.poids,
    taille: d.taille,
    pc: d.pc,
  };
}

export function subscribeToGrowth(
  onUpdate: (points: GrowthPoint[]) => void,
): () => void {
  const q = query(collection(db, COL), orderBy("day", "asc"));
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(toGrowthPoint));
  });
}

export async function fsAddGrowth(point: Omit<GrowthPoint, "id">): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    date: Timestamp.fromDate(point.date),
    day: point.day,
    poids: point.poids,
    taille: point.taille,
    pc: point.pc,
    createdAt: Timestamp.fromDate(new Date()),
  });
  return ref.id;
}

export async function fsDeleteGrowth(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
