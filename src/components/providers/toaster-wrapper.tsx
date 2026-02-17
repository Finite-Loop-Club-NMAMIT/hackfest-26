"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const ToasterProvider = dynamic(
  () => import("./toaster").then((mod) => mod.ToasterProvider),
  {
    ssr: false,
    loading: () => null,
  },
);

export function ToasterWrapper() {
  const pathname = usePathname();

  // Ah removed toast temporarily from main website
  if (!pathname?.startsWith("/dashboard")) {
    return null;
  }

  return <ToasterProvider />;
}
