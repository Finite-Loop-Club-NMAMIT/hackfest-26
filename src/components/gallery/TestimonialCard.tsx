"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { Quote } from "lucide-react";
import Image from "next/image";
import { cn } from "~/lib/utils";
import {
  ROLE_BORDER_COLORS,
  ROLE_COLORS,
  ROLE_GLOW_COLORS,
  ROLE_TITLES,
  type Testimonial,
} from "./testimonial-data";

type TestimonialCardProps = {
  testimonial: Testimonial;
  index: number;
};

export default function TestimonialCard({
  testimonial,
  index,
}: TestimonialCardProps) {
  const pirateTitle = ROLE_TITLES[testimonial.role];
  const roleColor = ROLE_COLORS[testimonial.role];
  const borderColor = ROLE_BORDER_COLORS[testimonial.role];
  const glowColor = ROLE_GLOW_COLORS[testimonial.role];

  const rotateXVal = useMotionValue(0);
  const rotateYVal = useMotionValue(0);
  const rotateX = useSpring(rotateXVal, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(rotateYVal, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    rotateXVal.set(((e.clientY - centerY) / (rect.height / 2)) * -4);
    rotateYVal.set(((e.clientX - centerX) / (rect.width / 2)) * 4);
  };

  const handleMouseLeave = () => {
    rotateXVal.set(0);
    rotateYVal.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.5,
        delay: (index % 6) * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative will-change-transform"
    >
      <div
        className={cn(
          "relative rounded-xl overflow-hidden transition-all duration-500",
          "bg-black/30 backdrop-blur-sm",
          "border",
          borderColor,
          "hover:bg-black/40",
          glowColor,
          "hover:shadow-[0_0_30px_rgba(251,191,36,0.08),0_8px_32px_rgba(0,0,0,0.3)]",
        )}
      >
        {/* Parchment texture */}
        <div className="absolute inset-0 bg-linear-to-br from-amber-900/5 via-transparent to-cyan-900/5 pointer-events-none" />
        <div className="absolute inset-0.5 border border-white/3 rounded-[10px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 p-5 md:p-6">
          {/* Wax seal quote icon */}
          <div className="absolute top-4 right-4 md:top-5 md:right-5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-amber-900/30 border border-amber-700/30 flex items-center justify-center group-hover:bg-amber-900/40 transition-colors duration-500">
                <Quote className="w-3.5 h-3.5 text-amber-400/60 group-hover:text-amber-400/80 transition-colors duration-500" />
              </div>
              <div className="absolute inset-0 rounded-full bg-amber-400/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>

          {/* Avatar + identity */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="relative shrink-0">
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-amber-600/30 group-hover:border-amber-500/50 transition-colors duration-500">
                <Image
                  src={`https://picsum.photos/seed/${testimonial.avatarSeed}/96/96`}
                  alt={testimonial.name}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="absolute -inset-0.5 rounded-full border border-amber-400/10 group-hover:border-amber-400/20 transition-colors duration-500" />
            </div>

            <div className="min-w-0">
              <p className="font-pirate text-base md:text-lg text-amber-100/90 leading-tight truncate">
                {testimonial.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={cn(
                    "text-xs font-crimson font-semibold uppercase tracking-wider",
                    roleColor,
                  )}
                >
                  {pirateTitle}
                </span>
                <span className="text-white/15">&middot;</span>
                <span className="text-xs font-crimson text-white/30">
                  {testimonial.role}
                </span>
                <span className="text-white/15">&middot;</span>
                <span className="text-xs font-crimson text-cyan-400/40">
                  {testimonial.year}
                </span>
              </div>
            </div>
          </div>

          {/* Quote text */}
          <div className="relative">
            <div
              className={cn(
                "absolute left-0 top-1 bottom-1 w-px transition-colors duration-500",
                "bg-amber-500/15 group-hover:bg-amber-500/30",
              )}
            />
            <p className="pl-4 text-sm md:text-base font-crimson text-cyan-100/70 leading-relaxed group-hover:text-cyan-100/80 transition-colors duration-500 italic">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
          </div>

          {/* Bottom year stamp */}
          <div className="mt-4 flex items-center gap-2">
            <div className="h-px grow bg-linear-to-r from-amber-600/15 to-transparent" />
            <span className="text-[10px] font-pirate text-amber-500/25 uppercase tracking-[0.2em]">
              Logged {testimonial.year}
            </span>
            <div className="h-px grow bg-linear-to-l from-amber-600/15 to-transparent" />
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t border-l border-amber-500/20 rounded-tl-sm pointer-events-none group-hover:border-amber-400/35 transition-colors duration-500" />
        <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t border-r border-amber-500/20 rounded-tr-sm pointer-events-none group-hover:border-amber-400/35 transition-colors duration-500" />
        <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b border-l border-amber-500/20 rounded-bl-sm pointer-events-none group-hover:border-amber-400/35 transition-colors duration-500" />
        <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b border-r border-amber-500/20 rounded-br-sm pointer-events-none group-hover:border-amber-400/35 transition-colors duration-500" />
      </div>
    </motion.div>
  );
}
