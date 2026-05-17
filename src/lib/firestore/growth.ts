import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GrowthMeasurement } from "@/types";

const COLLECTION = "growth";

function toMeasurement(
  snap: QueryDocumentSnapshot<DocumentData>
): GrowthMeasurement {
  const d = snap.data();
  return {
    id: snap.id,
    date: d.date,
    weight: d.weight ?? undefined,
    height: d.height ?? undefined,
    headCircumference: d.headCircumference ?? undefined,
    notes: d.notes ?? undefined,
    createdAt: (d.createdAt as Timestamp).toDate(),
    updatedAt: (d.updatedAt as Timestamp).toDate(),
  };
}

export async function getAllMeasurements(): Promise<GrowthMeasurement[]> {
  const q = query(collection(db, COLLECTION), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(toMeasurement);
}

export async function getMeasurementsForRange(
  from: string,
  to: string
): Promise<GrowthMeasurement[]> {
  const q = query(
    collection(db, COLLECTION),
    where("date", ">=", from),
    where("date", "<=", to),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(toMeasurement);
}

export async function addMeasurement(
  data: Omit<GrowthMeasurement, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = new Date();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    weight: data.weight ?? null,
    height: data.height ?? null,
    headCircumference: data.headCircumference ?? null,
    notes: data.notes ?? null,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
  return ref.id;
}

export async function updateMeasurement(
  id: string,
  patch: Partial<Omit<GrowthMeasurement, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...patch,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

export async function deleteMeasurement(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
