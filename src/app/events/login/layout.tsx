import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Hackfest'26 Events",
  description: "Sign in to your Hackfest'26 account to register for events.",
  openGraph: {
    title: "Login | Hackfest'26 Events",
    description: "Sign in to your Hackfest'26 account to register for events.",
  },
  twitter: {
    title: "Login | Hackfest'26 Events",
    description: "Sign in to your Hackfest'26 account to register for events.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
