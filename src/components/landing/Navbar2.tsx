'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const NAV_LINKS = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Tracks', href: '/tracks' },
    { name: 'Prizes', href: '/prizes' },
];

export function Navbar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);

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
            {/* Background Container */}
            <div className="absolute inset-0 w-full h-full shadow-2xl drop-shadow-xl rounded-lg overflow-hidden -z-10">
                <Image
                    src="/teal-leather.png"
                    alt="Leather Background"
                    fill
                    className="object-cover opacity-100 scale-[1.3]" // Keep the zoom
                    priority
                />

                {/* Dark Overlay: Adds contrast so gold text pops against the blue */}
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                {/* Inner Border (Stitching Effect) 
            Changed to a dashed light border to look like thread stitching on leather
        */}
                <div className="absolute inset-1.5 border-2 border-dashed border-amber-100/30 rounded-md pointer-events-none" />
                {/* Outer subtle highlight line */}
                <div className="absolute inset-0.5 border border-white/10 rounded-lg pointer-events-none" />
            </div>

            {/* Navbar Content */}
            <div className="relative flex items-center justify-between px-6 py-3 md:px-20 md:py-4 overflow-hidden">

                {/* Left: HF Logo */}
                {/* <Link href="/" className="flex-shrink-0 transition-transform hover:scale-105 active:scale-95">
                    <div className="absolute inset-0 bg-amber-400/60 blur-lg rounded-full scale- opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                    <div className="relative w-12 h-12 md:w-14 md:h-14">
                        <Image
                            src="/logos/glowingLogo2.png"
                            alt="Hackfest Logo"
                            fill
                            className="object-contain drop-shadow-md"
                        />
                    </div>
                </Link> */}
                <Link
                    href="/"
                    className="group relative flex-shrink-0 transition-transform hover:scale-105 active:scale-95"
                >
                    <div className="absolute inset-0 -z-10 flex items-center justify-center overflow">
                        <div className="w-16 h-16 md:w-20 md:h-5 rounded-full 
                        bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500
                        blur-2xl opacity-100
                        group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="absolute w-24 h-24 md:w-28 md:h-10 rounded-full
                        bg-amber-400/60 blur-3xl opacity-60
                        group-hover:opacity-90 transition-opacity duration-300" />
                        </div>

                    <div className="relative w-12 h-12 md:w-14 md:h-14">
                        <Image
                            src="/logos/glowingLogo2.png"
                            alt="Hackfest Logo"
                            fill
                            className="object-contain drop-shadow-[0_0_12px_rgba(255,191,0,0.6)]"
                        />
                    </div>
                </Link>


                {/* Center: Navigation Links */}
                <div className="hidden md:flex items-center gap-8">
                    {NAV_LINKS.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    'relative font-serif text-lg font-bold tracking-wide transition-colors duration-200',
                                    // Default: Pale Gold/Cream | Hover: White | Active: Bright Amber
                                    'text-amber-100/80 hover:text-white',
                                    isActive && 'text-amber-400 shadow-amber-500/50 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                )}
                            >
                                {link.name}

                                {/* Underline Animation (Glowing Gold) */}
                                <span
                                    className={cn(
                                        "absolute -bottom-1 left-0 h-[2px] w-full bg-amber-400 transition-transform duration-300 origin-left scale-x-0 rounded-full opacity-100 shadow-[0_0_10px_rgba(251,191,36,0.8)]",
                                        isActive && "scale-x-100",
                                        "group-hover:scale-x-100"
                                    )}
                                />
                            </Link>
                        );
                    })}
                </div>

                {/* Right: Sign In (Gold Metallic Button) */}
                <div className="flex items-center gap-4">
                    <button className="group relative px-6 py-2 font-serif font-bold text-amber-100 transition-all hover:text-white">
                        {/* Button Border / Gold Inset Look */}
                        <div className="absolute inset-0 border border-amber-200/40 rounded-md bg-white/5 group-hover:bg-white/10 transition-all" />

                        {/* Inner faint border for depth */}
                        <div className="absolute inset-[3px] border border-amber-200/20 rounded-sm opacity-50" />

                        <span className="relative z-10 drop-shadow-sm">Sign In</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}