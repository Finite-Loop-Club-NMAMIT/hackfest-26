import type { Metadata } from "next";
import { auth } from "~/auth/dashboard-config";
import { CommandMenu } from "~/components/ui/command-menu";
import { isAdmin } from "~/lib/auth/check-access";

export const metadata: Metadata = {
  title: {
    absolute: "Dashboard | Hackfest'26",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    siteName: "Hackfest",
    title: "Dashboard | Hackfest'26",
    description: "Dashboard for managing Hackfest'26 hackathon.",
    url: "https://hackfest.dev/dashboard",
    images: [
      {
        url: "/logos/hflogowithbg.webp",
        width: 1200,
        height: 630,
        alt: "Hackfest'26 Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard | Hackfest'26",
    description: "Dashboard for managing Hackfest'26 hackathon.",
    images: ["/logos/hflogowithbg.webp"],
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userIsAdmin = session?.dashboardUser
    ? isAdmin(session.dashboardUser)
    : false;

  return (
    <div className="dashboard-theme font-sans">
      <CommandMenu
        isAdmin={userIsAdmin}
        dashboardUser={session?.dashboardUser}
      />
      {children}
    </div>
  );
}
