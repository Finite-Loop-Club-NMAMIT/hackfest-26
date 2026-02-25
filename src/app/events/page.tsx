import { Suspense } from "react";
import { auth } from "~/auth/event-config";
import Events from "~/components/events/layout";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Events session={session} searchParams={searchParams} />
    </Suspense>
  );
}
