import { desc, eq } from "drizzle-orm";
import db from "~/db";
import { AppError } from "~/lib/errors/app-error";
import type { timerStatusType } from "../enum";
import { announcement, timer } from "../schema/timer";

export const computeRemaining = (
  status: timerStatusType,
  durationSeconds: number,
  elapsedSeconds: number,
  startedAt: number,
) => {
  if (status === "RUNNING" && startedAt) {
    const secondsSinceStart = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 1000,
    );
    return Math.max(0, durationSeconds - elapsedSeconds - secondsSinceStart);
  }
  return Math.max(0, durationSeconds - elapsedSeconds);
};

export async function getTimer() {
  return db.query.timer.findFirst();
}

export async function getAnnouncement() {
  return db.query.announcement.findFirst({
    where: eq(announcement.active, true),
    orderBy: desc(announcement.createdAt),
  });
}

export async function getAllAnnouncements() {
  return db.query.announcement.findMany({
    orderBy: desc(announcement.createdAt),
  });
}

export async function createAnnouncement(message: string, active: boolean) {
  if (active) {
    await db
      .update(announcement)
      .set({ active: false })
      .where(eq(announcement.active, true));
  }
  const [created] = await db
    .insert(announcement)
    .values({
      message,
      active,
    })
    .returning();
  return created;
}

export async function updateAnnouncement(
  id: string,
  message: string,
  active: boolean,
) {
  if (active) {
    await db
      .update(announcement)
      .set({ active: false })
      .where(eq(announcement.active, true));
  }
  const [updated] = await db
    .update(announcement)
    .set({
      message,
      active,
    })
    .where(eq(announcement.id, id))
    .returning();
  return updated;
}

export async function deleteAnnouncement(id: string) {
  return db.delete(announcement).where(eq(announcement.id, id));
}

export const getTimerState = async () => {
  let t = await db.query.timer.findFirst();
  if (!t) return null;

  if (t.status === "IDLE" && t.startTime) {
    const startMs = new Date(t.startTime).getTime();
    if (Date.now() >= startMs) {
      const [updated] = await db
        .update(timer)
        .set({
          status: "RUNNING",
          startedAt: startMs,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(timer.id, t.id))
        .returning();
      t = updated;
    }
  }

  const remaining = computeRemaining(
    t.status,
    t.durationSeconds,
    t.elapsedSeconds,
    t.startedAt ?? 0,
  );

  if (t.status === "RUNNING" && remaining === 0) {
    await db
      .update(timer)
      .set({
        status: "COMPLETED",
        elapsedSeconds: t.durationSeconds,
        startedAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(timer.id, t.id));
    return {
      ...t,
      status: "COMPLETED" as const,
      remaining: 0,
      elapsedSeconds: t.durationSeconds,
    };
  }

  return { ...t, remaining };
};

export async function upsertTimer(
  label: string,
  durationSeconds: number,
  startTime: string | null = null,
) {
  const existing = await db.query.timer.findFirst();
  if (existing) {
    const [updated] = await db
      .update(timer)
      .set({
        label,
        durationSeconds,
        startTime,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(timer.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(timer)
    .values({
      label,
      durationSeconds,
      startTime,
      elapsedSeconds: 0,
      status: "IDLE",
    })
    .returning();
  return created;
}

export async function startTimer() {
  const t = await db.query.timer.findFirst();
  console.log(t);
  if (!t) throw new AppError("No timer exists", 404);
  if (t.status === "RUNNING")
    throw new AppError("Timer is already running", 400);
  if (t.status === "COMPLETED")
    throw new AppError("Timer is completed. Reset it first.", 400);

  console.log("s");
  try {
    const [updated] = await db
      .update(timer)
      .set({
        status: "RUNNING",
        startedAt: Date.now(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(timer.id, t.id))
      .returning();
    console.log(updated);
    return updated;
  } catch (e) {
    console.log(e);
  }
}

export async function pauseTimer() {
  const t = await db.query.timer.findFirst();
  if (!t) throw new AppError("No timer exists", 404);
  if (t.status !== "RUNNING") throw new AppError("Timer is not running", 400);

  const secondsSinceStart = Math.floor(
    (Date.now() - (t.startedAt ?? Date.now())) / 1000,
  );
  const newElapsed = Math.min(
    t.elapsedSeconds + secondsSinceStart,
    t.durationSeconds,
  );

  const [updated] = await db
    .update(timer)
    .set({
      status: "PAUSED",
      elapsedSeconds: newElapsed,
      startedAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(timer.id, t.id))
    .returning();
  return updated;
}

export async function resetTimer() {
  const t = await db.query.timer.findFirst();
  if (!t) throw new AppError("No timer exists", 404);

  const [updated] = await db
    .update(timer)
    .set({
      status: "IDLE",
      elapsedSeconds: 0,
      startedAt: null,
      startTime: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(timer.id, t.id))
    .returning();
  return updated;
}

export async function adjustTimerDuration(deltaSeconds: number) {
  const t = await db.query.timer.findFirst();
  if (!t) throw new AppError("No timer exists", 404);

  const newDuration = Math.max(1, t.durationSeconds + deltaSeconds);
  const [updated] = await db
    .update(timer)
    .set({
      durationSeconds: newDuration,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(timer.id, t.id))
    .returning();
  return updated;
}

export async function setTimerDuration(durationSeconds: number) {
  const t = await db.query.timer.findFirst();
  if (!t) throw new AppError("No timer exists", 404);

  const [updated] = await db
    .update(timer)
    .set({
      durationSeconds: Math.max(1, durationSeconds),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(timer.id, t.id))
    .returning();
  return updated;
}
