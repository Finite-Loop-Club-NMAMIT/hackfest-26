"use client";

import { useRouter as useNextRouter } from "next/navigation";
import { useEffect } from "react";

export default function BrochureRedirect() {
  const router = useNextRouter();

  useEffect(() => {
    const link = document.createElement("a");
    link.href = "/images/brochure/brochure10.pdf";
    link.download = "Hackfest_Brochure.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    router.replace("/");
  }, [router]);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black">
      <div className="text-cyan-400 font-pirate text-2xl animate-pulse">
        Downloading Brochure...
      </div>
    </div>
  );
}
