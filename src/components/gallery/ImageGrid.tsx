"use client";

import { AnimatePresence, motion } from "framer-motion";
import GalleryCard from "./GalleryCard";
import type { GalleryImage } from "./gallery-data";

type ImageGridProps = {
  images: GalleryImage[];
  yearKey: number;
};

export default function ImageGrid({ images, yearKey }: ImageGridProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={yearKey}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 auto-rows-[200px] grid-flow-dense">
          {images.map((image, index) => (
            <GalleryCard key={image.id} image={image} index={index} />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
