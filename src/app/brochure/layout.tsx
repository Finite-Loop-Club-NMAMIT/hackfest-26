import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brochure",
  description: "View the official Hackfest'26 brochure and details.",
};

export default function BrochureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
