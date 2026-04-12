import { NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import {
  adjustTimerDuration,
  getAnnouncement,
  getTimerState,
  pauseTimer,
  resetTimer,
  setTimerDuration,
  startTimer,
  upsertTimer,
} from "~/db/services/timer-services";
import { errorResponse } from "~/lib/response/error";

export const GET = adminProtected(async () => {
  try {
    const [timerState, activeAnnouncement] = await Promise.all([
      getTimerState(),
      getAnnouncement(),
    ]);
    return NextResponse.json({
      timer: timerState,
      announcement: activeAnnouncement ?? null,
    });
  } catch (err) {
    return errorResponse(err);
  }
});

export const POST = adminProtected(async (req: Request) => {
  try {
    const body = await req.json();
    const { label, durationSeconds, startTime } = body;

    if (!label || typeof label !== "string") {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }
    if (
      !durationSeconds ||
      typeof durationSeconds !== "number" ||
      durationSeconds <= 0
    ) {
      return NextResponse.json(
        { error: "Duration must be a positive number" },
        { status: 400 },
      );
    }

    const result = await upsertTimer(label, durationSeconds, startTime || null);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
});

export const PATCH = adminProtected(async (req: Request) => {
  try {
    const body = await req.json();
    const { action } = body;

    const validActions = ["start", "pause", "reset", "adjust", "set_duration"];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: "Action must be valid" },
        { status: 400 },
      );
    }

    switch (action) {
      case "start":
        return NextResponse.json(await startTimer());
      case "pause":
        return NextResponse.json(await pauseTimer());
      case "reset":
        return NextResponse.json(await resetTimer());
      case "adjust":
        if (typeof body.deltaSeconds !== "number") {
          return NextResponse.json(
            { error: "deltaSeconds required" },
            { status: 400 },
          );
        }
        return NextResponse.json(await adjustTimerDuration(body.deltaSeconds));
      case "set_duration":
        if (
          typeof body.durationSeconds !== "number" ||
          body.durationSeconds <= 0
        ) {
          return NextResponse.json(
            { error: "durationSeconds required and must be positive" },
            { status: 400 },
          );
        }
        return NextResponse.json(await setTimerDuration(body.durationSeconds));
      default:
        return NextResponse.json(
          { error: "Action must be valid" },
          { status: 400 },
        );
    }
  } catch (err) {
    return errorResponse(err);
  }
});
