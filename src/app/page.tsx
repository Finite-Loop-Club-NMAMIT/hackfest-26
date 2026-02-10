import Link from "next/link";
import { auth } from "~/auth/config";
import Scene from "~/components/landing/Scene";
import { Button } from "~/components/ui/button";

export default async function Home() {
  const session = await auth();

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      {/* 3D Scene Background & Scroll Content */}
      <Scene user={session?.user} />
    </main>
  );
}

