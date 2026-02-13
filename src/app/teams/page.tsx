import { Home } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/auth/config";
import SignOut from "~/components/auth/authButtons/signOut";
import { TeamForm } from "~/components/teams/team-form";
import { Button } from "~/components/ui/button";
import * as userData from "~/db/data/participant";

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  if (!session.user.isRegistrationComplete) {
    redirect("/register");
  }

  const user = await userData.findByEmail(session.user.email);

  if (user?.teamId) {
    redirect(`/teams/${user.teamId}`);
  }

  return (
    // MAIN CONTAINER: Sky Gradient + Centering
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 overflow-hidden bg-gradient-to-b from-[#10569c] via-[#61b2e4] to-[#eef7fb] text-white">
      {/* --- DECORATIVE LAYERS (The Beach) --- */}
      {/* 1. Mist/Glow Layer */}
      <div className="absolute -bottom-[5%] left-[-20%] w-[140%] h-[35vh] bg-[#fffac2]/40 rounded-[100%] blur-3xl z-0 pointer-events-none" />
      {/* 2. Sand Layer */}
      <div className="absolute -bottom-[12%] left-[-10%] w-[120%] h-[30vh] bg-[#fbf6db] rounded-[50%] shadow-[0_-10px_50px_rgba(240,230,180,0.8)] z-0 pointer-events-none" />

      {/* --- CONTENT CONTAINER --- */}
      <div className="relative z-10 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* HEADER SECTION */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Home Button: Glass Style */}
            <Button
              asChild
              size="icon"
              className="bg-white/10 border border-white/20 hover:bg-white/20 text-white shadow-sm backdrop-blur-sm"
            >
              <Link href="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>

            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-bold drop-shadow-sm">
                Team Management
              </h1>
              <p className="text-white/80 text-lg leading-relaxed">
                Create a new team or join an existing one.
              </p>
            </div>
          </div>

          {/* Sign Out Button: Glass Style */}
          <div className="[&_button]:bg-white/10 [&_button]:border-white/20 [&_button]:text-white [&_button]:hover:bg-white/20 [&_button]:backdrop-blur-sm">
            <SignOut variant="outline" />
          </div>
        </div>

        {/* TEAM FORM */}
        <TeamForm />
      </div>
    </div>
  );
}
