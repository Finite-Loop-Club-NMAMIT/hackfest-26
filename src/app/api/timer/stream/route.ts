import { getAnnouncement, getTimerState } from "~/db/services/timer-services";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {}
      };

      let alive = true;

      request.signal.addEventListener("abort", () => {
        alive = false;
      });

      try {
        const [timerState, activeAnnouncement] = await Promise.all([
          getTimerState(),
          getAnnouncement(),
        ]);
        send({
          timer: timerState,
          announcement: activeAnnouncement ?? null,
        });
      } catch {
        send({ timer: null, announcement: null });
      }

      const interval = setInterval(async () => {
        if (!alive) {
          clearInterval(interval);
          try {
            controller.close();
          } catch {
            // Already closed
          }
          return;
        }

        try {
          const [timerState, activeAnnouncement] = await Promise.all([
            getTimerState(),
            getAnnouncement(),
          ]);
          send({
            timer: timerState,
            announcement: activeAnnouncement ?? null,
          });
        } catch {
          send({ timer: null, announcement: null });
        }
      }, 1000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
