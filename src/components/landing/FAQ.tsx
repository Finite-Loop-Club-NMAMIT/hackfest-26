"use client";

import Link from "next/link";
import { useState } from "react";

type FAQItem = { question: string; answer: string };

const faqs: FAQItem[] = [
  {
    question: "What is the registration charge?",
    answer:
      "The registration fee is ₹400/member which has to be paid after selection.",
  },
  {
    question: "Will there be accomodation provided?",
    answer: "Yes, basic accomodation will be provided.",
  },
  {
    question: "Will travel expenses be covered?",
    answer: "No, travel expenses will not be covered.",
  },
  {
    question: "Is it Open to All?",
    answer: "It's open to BE, BTech, BSc, BCA, MTech and MCA.",
  },
  {
    question: "Can students from different colleges form a team?",
    answer: "No, students must form a team within the same college.",
  },
];

function FAQItemCard({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`overflow-hidden bg-black/40 border rounded-2xl transition-all duration-500 ${
        isOpen
          ? "border-cyan-500/50"
          : "border-cyan-500/20 hover:border-cyan-500/40"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 md:px-8 md:py-6 text-left focus:outline-none group"
      >
        <span className="text-lg md:text-xl font-pirate font-bold text-white tracking-wide pr-4">
          {faq.question}
        </span>
        <svg
          className={`w-5 h-5 text-cyan-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <title>Toggle answer</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mx-6 md:mx-8 h-px bg-cyan-500/15" />
          <div className="px-6 pb-5 md:px-8 md:pb-6 pt-4">
            <p className="text-sm md:text-base text-gray-400 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative w-full py-4 md:py-1 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-900/5 rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/5 rounded-full" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-pirate font-black text-transparent bg-clip-text bg-linear-to-b from-cyan-200 to-blue-600 tracking-wider">
            FAQ
          </h2>
          <p className="mt-4 text-lg md:text-xl text-cyan-200/60 font-pirate tracking-wide">
            Answers from the captain&apos;s quarters
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <FAQItemCard
              key={faq.question}
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
        <div className="max-w-3xl mx-auto mt-12 overflow-hidden bg-black/40 border border-cyan-500/20 rounded-2xl p-8 flex flex-col items-center transition-all duration-500 hover:border-cyan-500/40">
          <p className="text-center text-lg font-pirate font-bold text-white tracking-wide">
            Have additional questions or facing any issues?
          </p>
          <Link href="/contact">
            <button
              type="button"
              className="group relative mt-6 px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-pirate font-bold text-2xl transition-all hover:scale-105 md:hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black tracking-wide"
            >
              <span className="relative z-10">Contact Us</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
