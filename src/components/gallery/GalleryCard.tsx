"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useRef } from "react";
import type { GalleryImage } from "./gallery-data";

type GalleryCardProps = {
  image: GalleryImage;
  index: number;
};

const aspectClasses: Record<GalleryImage["aspect"], string> = {
  tall: "",
  wide: "",
  square: "",
};

const rowSpanClasses: Record<GalleryImage["aspect"], string> = {
  tall: "row-span-2",
  wide: "row-span-1",
  square: "row-span-1",
};

export default function GalleryCard({ image, index }: GalleryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(600px) rotateX(${y * -8}deg) rotateY(${x * 8}deg) scale3d(1.02, 1.02, 1.02)`;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const el = cardRef.current;
    if (!el) return;
    el.style.transform =
      "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.04,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={rowSpanClasses[image.aspect]}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform:
            "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transition: "transform 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99)",
          transformStyle: "preserve-3d",
        }}
        className="group relative h-full rounded-lg border border-cyan-500/10 bg-black/20 hover:border-amber-500/30 will-change-transform overflow-hidden"
      >
        {/* Image fills entire card */}
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 rounded-lg"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Caption */}
        {image.caption && (
          <div className="absolute inset-x-0 bottom-0 p-3 pt-8 bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-b-lg overflow-hidden">
            <p className="text-sm text-amber-200/90 font-crimson">
              {image.caption}
            </p>
          </div>
        )}

        {/* 3D shine highlight */}
        <div
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255, 219, 112, 0.03) 45%, rgba(255, 219, 112, 0.06) 50%, transparent 55%)",
          }}
        />

        {/* Corner accents on hover */}
        <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-amber-500/0 group-hover:border-amber-500/30 rounded-tl-sm transition-colors duration-500 pointer-events-none" />
        <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-amber-500/0 group-hover:border-amber-500/30 rounded-tr-sm transition-colors duration-500 pointer-events-none" />
        <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-amber-500/0 group-hover:border-amber-500/30 rounded-bl-sm transition-colors duration-500 pointer-events-none" />
        <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-amber-500/0 group-hover:border-amber-500/30 rounded-br-sm transition-colors duration-500 pointer-events-none" />
      </div>
    </motion.div>
  );
}
