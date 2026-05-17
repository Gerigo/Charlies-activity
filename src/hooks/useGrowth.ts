import { useEffect, useState, useCallback } from "react";
import { GrowthMeasurement } from "@/types";
import {
  getAllMeasurements,
  addMeasurement,
  updateMeasurement,
  deleteMeasurement,
} from "@/lib/firestore/growth";

export function useGrowth() {
  const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllMeasurements();
      setMeasurements(data);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (data: Omit<GrowthMeasurement, "id" | "createdAt" | "updatedAt">) => {
      await addMeasurement(data);
      await refresh();
    },
    [refresh]
  );

  const edit = useCallback(
    async (
      id: string,
      patch: Partial<Omit<GrowthMeasurement, "id" | "createdAt" | "updatedAt">>
    ) => {
      await updateMeasurement(id, patch);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteMeasurement(id);
      await refresh();
    },
    [refresh]
  );

  return { measurements, loading, error, add, edit, remove, refresh };
}
