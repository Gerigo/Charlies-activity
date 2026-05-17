import {
  collection, doc, addDoc, deleteDoc,
  onSnapshot, query, where,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { GrowthPoint } from "@/lib/sampleData";
import { LEGACY_SCOPE, legacyToGrowth, growthToLegacy } from "./legacyAdapter";

const COL = "events";

export function subscribeToGrowth(
  onUpdate: (points: GrowthPoint[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COL), where("trackerId", "==", LEGACY_SCOPE));
  return onSnapshot(
    q,
    snap => {
      const points: GrowthPoint[] = [];
      snap.docs.forEach(docSnap => {
        try {
          const gp = legacyToGrowth(docSnap.id, docSnap.data());
          if (gp) points.push(gp);
        } catch (e) {
          console.warn('[Charlie Firestore] skipping malformed growth doc', docSnap.id, e);
        }
      });
      points.sort((a, b) => a.day - b.day);
      console.log(`[Charlie Firestore] growth points: ${points.length}`);
      onUpdate(points);
    },
    err => {
      console.error('[Charlie Firestore] growth subscription error:', err.message);
      onError?.(err);
    },
  );
}

export async function fsAddGrowth(point: Omit<GrowthPoint, "id">): Promise<string> {
  const ref = await addDoc(collection(db, COL), growthToLegacy(point, auth.currentUser?.uid ?? 'unknown'));
  return ref.id;
}

export async function fsDeleteGrowth(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
