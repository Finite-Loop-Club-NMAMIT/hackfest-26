"use client";

import { useTexture } from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import { cn } from "~/lib/utils";
import { WaveTransitionMaterial } from "./shader/WaveTransitionMaterial";

// Register the custom shader material
extend({ WaveTransitionMaterial });

// Track Data
const tracks = [
  {
    id: "fintech",
    title: "FinTech",
    image: "/images/tracks/Fintech.webp",
    desc: "Pioneering the future of finance by enhancing security, ensuring transparency, and fostering trust through cutting-edge decentralized technologies.",
  },
  {
    id: "healthcare",
    title: "Healthcare",
    image: "/images/tracks/Healthcare.webp",
    desc: "Transforming healthcare through groundbreaking technologies that enhance patient care, streamline operations, and redefine the future of medical innovation. Unlock the potential of innovation to shape the next era of healthcare.",
  },
  {
    id: "logistics",
    title: "Logistics",
    image: "/images/tracks/Logistics.webp",
    desc: "Reimagining the movement of goods and services with smart, efficient, and tech-driven solutions to optimize supply chains and elevate global connectivity.",
  },
  {
    id: "open-innovation",
    title: "Open Innovation",
    image: "/images/tracks/OpenInnovation.webp",
    desc: "Empowering bold ideas and creative solutions across diverse domains, breaking barriers to solve real-world challenges and shape a smarter tomorrow.",
  },
  {
    id: "sustainable-dev",
    title: "Sustainable Dev",
    image: "/images/tracks/SustainableDev.webp",
    desc: "Driving sustainable change with innovative technologies that combat environmental challenges, promote renewable energy, and build a cleaner, greener future. Harness the power of innovation to pave the way for a sustainable tomorrow.",
  },
];

// Preload textures
const textureUrls = tracks.map((t) => t.image);

// --- Shader Scene Component ---
// Define the material type with its custom uniforms/properties
type WaveTransitionMaterialType = THREE.ShaderMaterial & {
  uTime: number;
  uTransitionProgress: number;
  uPlaneRes: THREE.Vector2;
  uMediaRes1: THREE.Vector2;
  uMediaRes2: THREE.Vector2;
  tMap1: THREE.Texture | null;
  tMap2: THREE.Texture | null;
};

function TrackImageShader({ activeIndex }: { activeIndex: number }) {
  const { viewport } = useThree();
  const materialRef = useRef<WaveTransitionMaterialType>(null);

  // Load all textures
  const textures = useTexture(textureUrls);

  // State for transition
  const [currentTextureIndex, setCurrentTextureIndex] = useState(activeIndex);
  const [prevTextureIndex, setPrevTextureIndex] = useState(activeIndex);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    if (activeIndex !== currentTextureIndex) {
      setPrevTextureIndex(currentTextureIndex);
      setCurrentTextureIndex(activeIndex);
      progressRef.current = 0;
      targetProgressRef.current = 1;
      isTransitioningRef.current = true;
    }
  }, [activeIndex, currentTextureIndex]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;

      // Texture assignments
      const tex1 = textures[prevTextureIndex];
      const tex2 = textures[currentTextureIndex];

      // Ensure textures are valid before assigning to avoid WebGL errors
      if (tex1 && tex2) {
        materialRef.current.tMap1 = tex1;
        materialRef.current.tMap2 = tex2;

        // Resolution uniforms need to be set from the texture images
        if (tex1.image && tex2.image) {
          materialRef.current.uMediaRes1.set(
            (tex1.image as HTMLImageElement).width,
            (tex1.image as HTMLImageElement).height,
          );
          materialRef.current.uMediaRes2.set(
            (tex2.image as HTMLImageElement).width,
            (tex2.image as HTMLImageElement).height,
          );
        }
      }

      materialRef.current.uPlaneRes.set(viewport.width, viewport.height);

      // Animate progress
      if (isTransitioningRef.current) {
        // Smoothlerp
        const speed = 2.0;
        progressRef.current +=
          (targetProgressRef.current - progressRef.current) * speed * delta;

        // Snap to 1 when close
        if (Math.abs(targetProgressRef.current - progressRef.current) < 0.01) {
          progressRef.current = targetProgressRef.current;
          isTransitioningRef.current = false;
          // After transition completion, visually we are at texture 2.
          // Effectively prev becomes current for the next expected state, but logical state handles it.
        }
      } else {
        // Ensure it stays at 0 or 1 based on state, usually 1 after transition
        progressRef.current = 1;
      }

      materialRef.current.uTransitionProgress = progressRef.current;
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      {/* @ts-ignore */}
      <waveTransitionMaterial
        ref={materialRef}
        key={WaveTransitionMaterial.key}
        transparent={true}
      />
    </mesh>
  );
}

// --- Desktop 3D Card with Shader ---
function TrackCard3D({ activeIndex }: { activeIndex: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXVal = event.clientX - rect.left;
    const mouseYVal = event.clientY - rect.top;
    const xPct = mouseXVal / width - 0.5;
    const yPct = mouseYVal / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  // Get current track data
  // const track = tracks[activeIndex]; // Not currently used

  return (
    <motion.div
      className="perspective-1000 w-full max-w-md aspect-square relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
      }}
    >
      <motion.div
        className="w-full h-full relative rounded-2xl shadow-2xl overflow-hidden border border-cyan-500/30 bg-black/40"
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Shader Layer */}
        <div className="absolute inset-0 z-0">
          <Canvas>
            <TrackImageShader activeIndex={activeIndex} />
          </Canvas>

          {/* Dark Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
        </div>

        {/* Border Glow */}
        <div
          className="absolute inset-0 border-2 border-cyan-500/20 rounded-2xl pointer-events-none"
          style={{ transform: "translateZ(20px)" }}
        />
      </motion.div>
    </motion.div>
  );
}

// --- Mobile Swipe Stack ---
import { ChevronLeft, ChevronRight } from "lucide-react";

function MobileTrackStack() {
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % tracks.length);
  };

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const activeTrack = tracks[activeIndex];

  return (
    <div className="flex flex-col items-center justify-center pt-8 w-full gap-6 relative px-4">
      <div className="relative w-full max-w-sm aspect-square">
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 lg:p-3 bg-black/80 md:bg-black/40 hover:bg-black/90 md:hover:bg-black/70 md:backdrop-blur-md rounded-full border border-cyan-500/30 text-cyan-400 transition-all hover:scale-110 active:scale-95 shrink-0"
          aria-label="Previous Track"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="absolute inset-0 w-full h-full">
          {tracks.map((track, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={track.id}
                className={cn(
                  "absolute inset-0 w-full h-full border border-cyan-500/30 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg transition-all duration-300",
                  isActive
                    ? "opacity-100 scale-100 z-10"
                    : "opacity-0 scale-95 pointer-events-none z-0",
                )}
              >
                <Image
                  src={track.image}
                  alt={track.title}
                  fill
                  className="object-cover"
                  draggable={false}
                  priority={i === 0}
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 lg:p-3 bg-black/80 md:bg-black/40 hover:bg-black/90 md:hover:bg-black/70 md:backdrop-blur-md rounded-full border border-cyan-500/30 text-cyan-400 transition-all hover:scale-110 active:scale-95 shrink-0"
          aria-label="Next Track"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="text-center w-full z-20">
        <h3 className="text-2xl font-bold font-crimson text-cyan-400 mb-3 tracking-wide drop-shadow-md">
          {activeTrack.title}
        </h3>
        <p className="text-lg font-crimson font-bold text-cyan-200/70 mb-4 px-4 leading-snug">
          {activeTrack.desc}
        </p>
        <div className="flex gap-2 justify-center mt-2">
          {tracks.map((track, i) => (
            <div
              key={track.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-8 bg-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "w-2 bg-cyan-900"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function TracksSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Preload textures on mount
  useEffect(() => {
    useTexture.preload(textureUrls);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <section className="relative w-full pt-8 pb-16 px-4 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="hidden md:block absolute top-1/4 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden md:block absolute bottom-1/4 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl z-10">
        <motion.h2
          className="text-6xl md:text-7xl font-pirate font-black text-center mb-4 text-transparent bg-clip-text bg-linear-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] tracking-wider"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Tracks
        </motion.h2>

        {isMobile ? (
          <MobileTrackStack />
        ) : (
          <div className="flex flex-row gap-2 lg:gap-8 items-center h-[400px] lg:h-[600px] w-full justify-between">
            {/* Left Side: Fixed List with Animated Selection */}
            <div
              className="w-[30%] lg:w-[28%] shrink-0 flex flex-col items-start justify-center relative h-[320px] lg:h-[460px]"
              style={{ perspective: "1000px" }}
            >
              <div
                className="relative flex flex-col items-start gap-1 lg:gap-2 w-full h-full justify-center"
                style={{ transformStyle: "preserve-3d" }}
              >
                {tracks.map((track, index) => {
                  const isActive = activeTab === index;

                  return (
                    <motion.button
                      key={track.id}
                      onClick={() => setActiveTab(index)}
                      className="relative group text-left px-3 py-2 lg:px-6 lg:py-3 rounded-xl w-full md:w-[90%]"
                      style={{
                        transformStyle: "preserve-3d",
                      }}
                      animate={{
                        scale: isActive ? 1.08 : 1,
                        x: isActive ? 15 : 0,
                        z: isActive ? 30 : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      whileHover={{
                        scale: isActive ? 1.08 : 1.03,
                        x: isActive ? 15 : 5,
                      }}
                    >
                      {/* Glow background for active item */}
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-linear-to-r from-cyan-500/30 via-cyan-400/20 to-transparent"
                        animate={{
                          opacity: isActive ? 1 : 0,
                          boxShadow: isActive
                            ? "inset 0 0 20px rgba(34, 211, 238, 0.1)"
                            : "inset 0 0 0px rgba(34, 211, 238, 0)",
                        }}
                        transition={{ duration: 0.3 }}
                      />

                      {/* Active indicator bar */}
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-full"
                        animate={{
                          opacity: isActive ? 1 : 0,
                          scaleY: isActive ? 1 : 0,
                          boxShadow: isActive
                            ? "0 0 10px rgba(34, 211, 238, 0.8)"
                            : "0 0 0px rgba(34, 211, 238, 0)",
                        }}
                        transition={{ duration: 0.2 }}
                      />

                      {/* Track title */}
                      <motion.span
                        className="relative z-10 text-base md:text-[1.1rem] lg:text-3xl font-crimson font-bold tracking-wide lg:tracking-wider whitespace-nowrap pl-2 lg:pl-4"
                        animate={{
                          color: isActive ? "#67e8f9" : "#9ca3af",
                          textShadow: isActive
                            ? "0 0 20px rgba(103, 232, 249, 0.6), 0 0 40px rgba(103, 232, 249, 0.3)"
                            : "0 0 0px rgba(103, 232, 249, 0), 0 0 0px rgba(103, 232, 249, 0)",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {track.title}
                      </motion.span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Combined Image and Desc Background */}
            <div className="flex-1 flex flex-row items-center justify-between gap-4 lg:gap-8 bg-black/20 backdrop-blur-md rounded-xl p-4 lg:p-6 border border-blue-900/50 shadow-lg h-[350px] lg:h-[460px]">
              {/* the 3d thing */}
              <div className="flex-1 flex justify-center items-center perspective-1000 z-20">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-[85%] max-w-[320px] lg:max-w-[600px] lg:w-full flex justify-center"
                >
                  <TrackCard3D activeIndex={activeTab} />
                </motion.div>
              </div>

              {/* description */}
              <div className="w-[45%] lg:w-[42%] shrink-0 flex flex-col justify-center items-start text-left h-full">
                {/* CHANGE HERE FOR BIGGER DESCRIPTION: remove `h-[320px] lg:h-[500px]` and rely on inner padding or use `h-auto` if the text needs more vertical space */}
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full relative z-10 h-full flex flex-col justify-center"
                >
                  <p className="text-lg md:text-xl lg:text-2xl font-crimson font-bold text-cyan-200/70 leading-snug lg:leading-[1.4] tracking-wide">
                    {tracks[activeTab].desc}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
