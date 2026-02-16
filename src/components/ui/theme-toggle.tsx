"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useDayNight } from "~/components/providers/useDayNight";
<<<<<<< HEAD
=======

<<<<<<< HEAD
>>>>>>> a945d76 (feat: added contact us page and enhanced images quality)

=======
>>>>>>> a593772 (refactor: remove unnecessary empty line.)
export function ThemeToggle() {
  const { isNight, toggleTheme } = useDayNight();
  const pathname = usePathname();

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 0544a48 (refactor: Move timeline scene and water background components into a dedicated `components` subdirectory.)
=======
>>>>>>> a945d76 (feat: added contact us page and enhanced images quality)
=======
>>>>>>> f879387 (feat: added about us page and optimized UI to be smooth by elminating some blurs and animations)
  if (
    pathname === "/contact" ||
    pathname === "/about" ||
    pathname === "/timeline"
  )
    return null;
<<<<<<< HEAD
<<<<<<< HEAD
=======
  if (pathname === "/contact" || pathname === "/about") return null;
>>>>>>> b576a06 (feat: added about us page and optimized UI to be smooth by elminating some blurs and animations)
=======
>>>>>>> 0544a48 (refactor: Move timeline scene and water background components into a dedicated `components` subdirectory.)
=======
=======
  if (pathname === "/contact") return null;
>>>>>>> 4e550d1 (feat: added contact us page and enhanced images quality)
<<<<<<< HEAD
>>>>>>> a945d76 (feat: added contact us page and enhanced images quality)
=======
=======
  if (pathname === "/contact" || pathname === "/about") return null;
>>>>>>> db5812d (feat: added about us page and optimized UI to be smooth by elminating some blurs and animations)
>>>>>>> f879387 (feat: added about us page and optimized UI to be smooth by elminating some blurs and animations)

  return (
    <motion.button
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:bg-black/60 transition-colors"
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isNight ? 0 : 180 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
      >
        {isNight ? (
          <Moon className="h-6 w-6 text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.5)]" />
        ) : (
          <Sun className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
        )}
      </motion.div>
    </motion.button>
  );
}
