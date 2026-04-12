import { NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  updateAnnouncement,
} from "~/db/services/timer-services";
import { errorResponse } from "~/lib/response/error";

export const GET = adminProtected(async () => {
  try {
    const announcements = await getAllAnnouncements();
    return NextResponse.json(announcements);
  } catch (err) {
    return errorResponse(err);
  }
});

export const POST = adminProtected(async (req: Request) => {
  try {
    const body = await req.json();
    const { message, active } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const result = await createAnnouncement(message, active ?? false);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
});

export const PATCH = adminProtected(async (req: Request) => {
  try {
    const body = await req.json();
    const { id, message, active } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Announcement ID is required" },
        { status: 400 },
      );
    }
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const result = await updateAnnouncement(id, message, active ?? false);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
});

export const DELETE = adminProtected(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Announcement ID is required" },
        { status: 400 },
      );
    }

    await deleteAnnouncement(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
});
