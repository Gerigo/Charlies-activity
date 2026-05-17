import { BabyEvent, DaySummary, FeedingDetail, SleepDetail } from "@/types";

/** Compute a DaySummary from a list of events for a single day. */
export function computeDaySummary(
  date: string,
  events: BabyEvent[]
): DaySummary {
  let sleepMinutes = 0;
  let mealCount = 0;
  let pumpedMl = 0;
  let diaperCount = 0;
  let isSleeping = false;
  let lastBreast: "left" | "right" | undefined;
  let lastTemperature: number | undefined;

  for (const event of events) {
    switch (event.detail.type) {
      case "sleep": {
        const d = event.detail as SleepDetail;
        if (d.isActive) {
          isSleeping = true;
        } else if (event.endTime) {
          sleepMinutes += Math.round(
            (event.endTime.getTime() - event.startTime.getTime()) / 60000
          );
        }
        break;
      }
      case "feeding": {
        const d = event.detail as FeedingDetail;
        mealCount++;
        if (d.breast) lastBreast = d.breast;
        break;
      }
      case "pumping":
        pumpedMl += event.detail.quantityMl;
        break;
      case "diaper":
        diaperCount++;
        break;
      case "temperature":
        lastTemperature = event.detail.value;
        break;
    }
  }

  return {
    date,
    sleepMinutes,
    mealCount,
    pumpedMl,
    diaperCount,
    isSleeping,
    lastBreast,
    lastTemperature,
  };
}

/** Format minutes as "Xh Ym". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/** Return today's date as YYYY-MM-DD (local time). */
export function todayString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/** Shift a YYYY-MM-DD date by N days. */
export function shiftDate(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
