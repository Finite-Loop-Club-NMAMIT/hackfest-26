import db from "../index";
import { ideaSubmission, teams } from "../schema";
import { tracks } from "../schema/tracks";
import { eq, desc } from "drizzle-orm";
import { AppError } from "~/lib/errors/app-error";

export async function createTrack({ name }: { name: string }) {
    try {
        const [track] = await db.insert(tracks).values({ name }).returning();
        return track;
    } catch (error: any) {
        console.error("Error creating track:", error);
        throw new AppError("Failed to create track", 500);
    }
}

export async function getTracks() {
    try {
        const allTracks = await db.select().from(tracks).orderBy(desc(tracks.createdAt));
        return allTracks;
    } catch (error) {
        console.error("Error fetching tracks:", error);
        throw new AppError("Failed to fetch tracks", 500);
    }
}

export async function deleteTrack(id: string) {
    try {
        const [attachedTeam] = await db.select({ id: ideaSubmission.id })
            .from(ideaSubmission)
            .where(eq(ideaSubmission.trackId, id))
            .limit(1);

        if (attachedTeam) {
            throw new AppError("Cannot delete track as it has teams attached", 400);
        }

        await db.delete(tracks).where(eq(tracks.id, id));
        return { success: true };
    } catch (error) {
        console.error("Error deleting track:", error);
        throw new AppError("Failed to delete track", 500);
    }
}
