import { auth } from "~/auth/event-config";
import Events from "~/components/events/eventLayout";

export default async function EventsPage() {
  const session = await auth();
  return (
    <section>
      <Events session={session} />
    </section>
  );
}
