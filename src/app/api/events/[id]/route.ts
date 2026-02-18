import { type NextRequest, NextResponse } from "next/server";
import { getAllEvents } from "~/db/data/events";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.pathname.split("/").pop() || "";
  try {
    switch (action) {
      case "getAll":
        return NextResponse.json(await getAllEvents());
      default:
        return NextResponse.json(
          { success: false, error: "Unknown action" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Events route error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      {
        statusText:
          ((error as Error).cause as string) || "Internal Server Error",
      },
    );
  }
}
