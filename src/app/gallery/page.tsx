import type { Metadata } from "next";
import { auth } from "~/auth/config";
import GalleryPage from "~/components/gallery/GalleryPage";
import GalleryScene from "~/components/gallery/GalleryScene";
import Footer from "~/components/landing/Footer";
import { Navbar } from "~/components/landing/Navbar";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Explore the treasure trove of memories from past Hackfest voyages.",
};

export default async function GalleryRoute() {
  const session = await auth();

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden text-white selection:bg-cyan-500/30">
      <GalleryScene />

      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar isUnderwater={true} session={session} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="grow pt-36 md:pt-42 pb-16 px-4 flex flex-col items-center">
          <GalleryPage />
        </div>

        <Footer />
      </div>
    </main>
  );
}
