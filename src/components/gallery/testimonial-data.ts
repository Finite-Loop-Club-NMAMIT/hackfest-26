export type Testimonial = {
  id: string;
  name: string;
  role: "Hacker" | "Mentor" | "Organizer" | "Judge" | "Volunteer";
  year: number;
  quote: string;
  /** Optional avatar seed used with placeholder service */
  avatarSeed: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t-01",
    name: "Arjun Nair",
    role: "Hacker",
    year: 2025,
    quote:
      "Hackfest wasn't just a hackathon  it was a full-blown adventure. The energy on the floor at 3 AM was unreal. I walked in with an idea and walked out with a prototype and lifelong friends.",
    avatarSeed: "arjun",
  },
  {
    id: "t-02",
    name: "Priya Sharma",
    role: "Mentor",
    year: 2025,
    quote:
      "Mentoring at Hackfest was like guiding young captains through their first storm. The creativity these students bring is nothing short of extraordinary. Proud to be part of this voyage.",
    avatarSeed: "priya",
  },
  {
    id: "t-03",
    name: "Rahul Deshmukh",
    role: "Organizer",
    year: 2024,
    quote:
      "Building Hackfest from the ground up taught me more about leadership than any textbook could. Watching hundreds of hackers bring their wildest ideas to life that's the real treasure.",
    avatarSeed: "rahul",
  },
  {
    id: "t-04",
    name: "Sneha Kulkarni",
    role: "Hacker",
    year: 2024,
    quote:
      "We coded through the night, fuelled by chai and sheer determination. Our team's project started as a joke and ended up winning second place. Hackfest taught me that the craziest ideas are worth pursuing.",
    avatarSeed: "sneha",
  },
  {
    id: "t-05",
    name: "Dr. Vikram Patel",
    role: "Judge",
    year: 2025,
    quote:
      "The quality of projects at Hackfest rivals what I see at industry-level events. These students aren't just coding  they're solving real problems with genuine passion. Truly impressive.",
    avatarSeed: "vikram",
  },
  {
    id: "t-06",
    name: "Meera Hegde",
    role: "Volunteer",
    year: 2024,
    quote:
      "Being a volunteer at Hackfest meant being in the heart of the action. From managing logistics to cheering teams on at 4 AM  every moment was worth it. The spirit here is unmatched.",
    avatarSeed: "meera",
  },
  {
    id: "t-07",
    name: "Karthik Rao",
    role: "Hacker",
    year: 2025,
    quote:
      "I came solo, got matched with strangers, and by hour six we were functioning like a well-oiled machine. Hackfest doesn't just test your skills  it forges bonds through the fire of innovation.",
    avatarSeed: "karthik",
  },
  {
    id: "t-08",
    name: "Ananya Bhat",
    role: "Mentor",
    year: 2024,
    quote:
      "What sets Hackfest apart is the atmosphere. It's not cutthroat  it's collaborative. Teams help each other, mentors go the extra mile, and everyone celebrates every win, big or small.",
    avatarSeed: "ananya",
  },
  {
    id: "t-09",
    name: "Rohan Shetty",
    role: "Hacker",
    year: 2024,
    quote:
      "Hackfest pushed me beyond what I thought I was capable of. In 36 hours, I learned more about real-world development than I did in an entire semester. Can't wait for the next one.",
    avatarSeed: "rohan",
  },
];

/** Role-to-pirate-title mapping for thematic display */
export const ROLE_TITLES: Record<Testimonial["role"], string> = {
  Hacker: "Deckhand",
  Mentor: "Navigator",
  Organizer: "Quartermaster",
  Judge: "Admiral",
  Volunteer: "First Mate",
};

/** Role-specific accent colors */
export const ROLE_COLORS: Record<Testimonial["role"], string> = {
  Hacker: "text-cyan-300",
  Mentor: "text-amber-300",
  Organizer: "text-emerald-300",
  Judge: "text-purple-300",
  Volunteer: "text-rose-300",
};

export const ROLE_BORDER_COLORS: Record<Testimonial["role"], string> = {
  Hacker: "border-cyan-500/30",
  Mentor: "border-amber-500/30",
  Organizer: "border-emerald-500/30",
  Judge: "border-purple-500/30",
  Volunteer: "border-rose-500/30",
};

export const ROLE_GLOW_COLORS: Record<Testimonial["role"], string> = {
  Hacker: "shadow-[0_0_20px_rgba(34,211,238,0.1)]",
  Mentor: "shadow-[0_0_20px_rgba(251,191,36,0.1)]",
  Organizer: "shadow-[0_0_20px_rgba(52,211,153,0.1)]",
  Judge: "shadow-[0_0_20px_rgba(168,85,247,0.1)]",
  Volunteer: "shadow-[0_0_20px_rgba(251,113,133,0.1)]",
};
