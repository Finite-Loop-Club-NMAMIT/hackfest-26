import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timeline",
  description: "Explore the schedule and timeline of Hackfest'26.",
};

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
