export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  aspect: "tall" | "wide" | "square";
};

export type GalleryYear = {
  year: number;
  title: string;
  subtitle: string;
  images: GalleryImage[];
};

// Placeholder images using picsum.photos for varied dummy content
const placeholders = {
  tall: (id: number) => `https://picsum.photos/seed/hf${id}/400/600`,
  wide: (id: number) => `https://picsum.photos/seed/hf${id}/600/400`,
  square: (id: number) => `https://picsum.photos/seed/hf${id}/500/500`,
};

export const GALLERY_YEARS: GalleryYear[] = [
  {
    year: 2025,
    title: "Hackfest 2025: Tech Olympus",
    subtitle: "Where technology meets power of the Gods",
    images: [
      {
        id: "2025-01",
        src: placeholders.wide(2501),
        alt: "Opening ceremony 2025",
        caption: "The fleet assembles",
        aspect: "wide",
      },
      {
        id: "2025-02",
        src: placeholders.tall(2502),
        alt: "Hacking in progress",
        caption: "Navigating the code seas",
        aspect: "tall",
      },
      {
        id: "2025-03",
        src: placeholders.square(2503),
        alt: "Team collaboration",
        caption: "Crew quarters",
        aspect: "square",
      },
      {
        id: "2025-04",
        src: placeholders.wide(2504),
        alt: "Workshop session",
        caption: "Charting new waters",
        aspect: "wide",
      },
      {
        id: "2025-05",
        src: placeholders.tall(2505),
        alt: "Late night coding",
        caption: "Burning the midnight oil",
        aspect: "tall",
      },
      {
        id: "2025-06",
        src: placeholders.square(2506),
        alt: "Mentor guidance",
        caption: "The captain's counsel",
        aspect: "square",
      },
      {
        id: "2025-07",
        src: placeholders.wide(2507),
        alt: "Prize ceremony",
        caption: "The treasure is claimed",
        aspect: "wide",
      },
      {
        id: "2025-08",
        src: placeholders.tall(2508),
        alt: "Hackathon venue",
        caption: "The grand harbour",
        aspect: "tall",
      },
      {
        id: "2025-09",
        src: placeholders.square(2509),
        alt: "Team photo",
        caption: "United crew",
        aspect: "square",
      },
      {
        id: "2025-10",
        src: placeholders.wide(2510),
        alt: "Demo presentations",
        caption: "Presenting the bounty",
        aspect: "wide",
      },
      {
        id: "2025-11",
        src: placeholders.tall(2511),
        alt: "Food and refreshments",
        caption: "The galley feast",
        aspect: "tall",
      },
      {
        id: "2025-12",
        src: placeholders.square(2512),
        alt: "Closing ceremony",
        caption: "Until the next voyage",
        aspect: "square",
      },
    ],
  },
  {
    year: 2024,
    title: "Hackfest 2024: Retro-Futurism",
    subtitle: "A journey through time and technology",
    images: [
      {
        id: "2024-01",
        src: placeholders.tall(2401),
        alt: "Kickoff event 2024",
        caption: "Setting sail",
        aspect: "tall",
      },
      {
        id: "2024-02",
        src: placeholders.wide(2402),
        alt: "Participants hacking",
        caption: "Full speed ahead",
        aspect: "wide",
      },
      {
        id: "2024-03",
        src: placeholders.square(2403),
        alt: "Team brainstorming",
        caption: "Plotting the course",
        aspect: "square",
      },
      {
        id: "2024-04",
        src: placeholders.tall(2404),
        alt: "Stage presentation",
        caption: "Raising the flag",
        aspect: "tall",
      },
      {
        id: "2024-05",
        src: placeholders.wide(2405),
        alt: "Networking session",
        caption: "Alliance of crews",
        aspect: "wide",
      },
      {
        id: "2024-06",
        src: placeholders.square(2406),
        alt: "Winners celebration",
        caption: "Treasure found",
        aspect: "square",
      },
      {
        id: "2024-07",
        src: placeholders.wide(2407),
        alt: "Group photo 2024",
        caption: "The armada",
        aspect: "wide",
      },
      {
        id: "2024-08",
        src: placeholders.tall(2408),
        alt: "Coding closeup",
        caption: "Decoding the map",
        aspect: "tall",
      },
      {
        id: "2024-09",
        src: placeholders.square(2409),
        alt: "Fun activities",
        caption: "Shore leave",
        aspect: "square",
      },
    ],
  },
];
