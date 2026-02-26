import { SessionProvider } from "next-auth/react";

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider basePath="/api/auth/event">{children}</SessionProvider>
  );
}
