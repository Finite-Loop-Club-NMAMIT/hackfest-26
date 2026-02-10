'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility for cleaner tailwind classes ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Navigation Data ---
const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Tracks', href: '/tracks' },
  { name: 'Prizes', href: '/prizes' },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Optional: Add a subtle effect when scrolling down
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl',
        'transition-all duration-300 ease-out',
        scrolled ? 'top-2 scale-[0.98]' : 'top-6'
      )}
    >
      {/* Container for the Parchment Texture 
        We use a pseudo-element or absolute div for the background image 
        so we can manipulate opacity/shadows independently.
      */}
      <div className="absolute inset-0 w-full h-full shadow-2xl drop-shadow-xl rounded-lg overflow-hidden -z-10 ">
        <Image
          src="/parchment-bg.png" // Ensure this is a seamless texture
          alt="Parchment Background"
          fill
          className="object-cover opacity-100 scale-130"
          priority
        />
        {/* Overlay to warm up the texture if needed */}
        <div className="absolute inset-0 bg-amber-100/20 mix-blend-multiply pointer-events-none" />
        
        {/* Inner Border (The "Drawn" Ink Line) */}
        <div className="absolute inset-1.5 border-2 border-[#5c4033]/60 rounded-md pointer-events-none" />
        <div className="absolute inset-1 border border-[#5c4033]/30 rounded-md pointer-events-none" />
      </div>

      {/* Navbar Content */}
      <div className="relative flex items-center justify-between px-6 py-3 md:px-25 md:py-4">
        
        {/* Left: HF Logo (Leather Style) */}
        <Link href="/" className="flex-shrink-0 transition-transform hover:scale-105 active:scale-95">
          <div className="relative w-12 h-12 md:w-14 md:h-14">
            <Image
              src="/logo.png"
              alt="Hackfest Logo"
              fill
              className="object-contain drop-shadow-md"
            />
          </div>
        </Link>

        {/* Center/Right: Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'relative font-serif text-lg font-bold tracking-wide transition-colors duration-200',
                  'text-[#3e2723] hover:text-[#8d6e63]',
                  isActive && 'text-[#b71c1c]' // Red ink for active state
                )}
              >
                {link.name}
                {/* Ink Underline Animation */}
                <span 
                  className={cn(
                    "absolute -bottom-1 left-0 h-[2px] w-full bg-[#b71c1c] transition-transform duration-300 origin-left scale-x-0 rounded-full opacity-70",
                    isActive && "scale-x-100",
                    "group-hover:scale-x-100"
                  )} 
                />
              </Link>
            );
          })}
        </div>

        {/* Far Right: Sign In (Styled as a Stamp or Wax Seal button) */}
        <div className="flex items-center gap-4">
          <button className="group relative px-6 py-2 font-serif font-bold text-[#3e2723] transition-all hover:text-[#2d1b18]">
            {/* Button Border / Stamp Look */}
            <div className="absolute inset-0 border-2 border-[#3e2723] rounded-md opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0.5 border border-[#3e2723] rounded-sm opacity-30 group-hover:opacity-60 transition-opacity" />
            
            <span className="relative z-10">Sign In</span>
          </button>
          
          {/* Mobile Menu Toggle (Hamburger) would go here */}
        </div>
      </div>
    </nav>
  );
}