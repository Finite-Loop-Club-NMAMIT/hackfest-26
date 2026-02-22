import { NextResponse } from "next/server";
import { publicRoute } from "~/auth/route-handlers";
import { adminProtected } from "~/auth/routes-wrapper";
import {
  createTrack,
  deleteTrack,
  getTracks,
} from "~/db/services/track-services";
import { AppError } from "~/lib/errors/app-error";

export const GET = publicRoute(async () => {
  try {
    const tracks = await getTracks();
    return NextResponse.json(tracks);
  } catch (error) {
    if (error instanceof AppError) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
});

export const POST = adminProtected(async (req: Request) => {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return new NextResponse("Track name is required", { status: 400 });
    }

    const track = await createTrack({ name });
    return NextResponse.json(track);
  } catch (error) {
    if (error instanceof AppError) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
});

export const DELETE = adminProtected(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Track ID is required", { status: 400 });
    }

    await deleteTrack(id);
    return new NextResponse("Track deleted successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
});
