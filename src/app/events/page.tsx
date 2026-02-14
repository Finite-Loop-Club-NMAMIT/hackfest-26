import { auth } from "~/auth/event-config";
import Events from "~/components/events/layout";

export default async function EventsPage() {
  const session = await auth();

  return <Events session={session} />;
}
