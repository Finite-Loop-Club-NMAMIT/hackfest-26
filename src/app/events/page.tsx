import { Suspense } from "react";
import Events from "~/components/events/layout";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Events searchParams={searchParams} />
    </Suspense>
  );
}
