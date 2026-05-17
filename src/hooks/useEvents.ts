import { useEffect, useState, useCallback } from "react";
import { BabyEvent, DaySummary, EventDetail } from "@/types";
import {
  getEventsForDay,
  getActiveSleep,
  addEvent,
  updateEvent,
  deleteEvent,
  stopSleep,
} from "@/lib/firestore/events";
import { computeDaySummary, todayString } from "@/lib/summary";

export function useEvents(date: string) {
  const [events, setEvents] = useState<BabyEvent[]>([]);
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [activeSleep, setActiveSleep] = useState<BabyEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [dayEvents, sleep] = await Promise.all([
        getEventsForDay(date),
        date === todayString() ? getActiveSleep() : Promise.resolve(null),
      ]);
      setEvents(dayEvents);
      setSummary(computeDaySummary(date, dayEvents));
      setActiveSleep(sleep);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logEvent = useCallback(
    async (detail: EventDetail, opts?: { notes?: string; startTime?: Date }) => {
      await addEvent(detail, opts);
      await refresh();
    },
    [refresh]
  );

  const editEvent = useCallback(
    async (
      id: string,
      patch: Parameters<typeof updateEvent>[1]
    ) => {
      await updateEvent(id, patch);
      await refresh();
    },
    [refresh]
  );

  const removeEvent = useCallback(
    async (id: string) => {
      await deleteEvent(id);
      await refresh();
    },
    [refresh]
  );

  const endSleep = useCallback(
    async (id: string) => {
      await stopSleep(id);
      await refresh();
    },
    [refresh]
  );

  return {
    events,
    summary,
    activeSleep,
    loading,
    error,
    logEvent,
    editEvent,
    removeEvent,
    endSleep,
    refresh,
  };
}
