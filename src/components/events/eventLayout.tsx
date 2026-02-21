"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  CalendarDays,
  Compass,
  MapPin,
  TriangleAlert,
  Users,
} from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Button } from "~/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "~/components/ui/drawer";

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  type: "Solo" | "Team";
  status: "Draft" | "Published" | "Ongoing" | "Completed";
  maxTeams: number;
  minTeamSize: number;
  maxTeamSize: number;
  image?: string;
  deadline: string;
};

const Events = ({ session }: { session: Session | null }) => {
  const isLoggedIn = !!session?.eventUser?.email;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>();
  const [drawerDirection, setDrawerDirection] = useState<"right" | "bottom">(
    "right",
  );
  const [loading, setLoading] = useState({
    events: true,
    checkingRegistration: false,
    register: false,
    createTeam: false,
    confirmTeam: false,
    deleteTeam: false,
    leaveTeam: false,
    joinTeam: false,
    removeMember: false,
    checkAvailable: false,
  });
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      setDrawerDirection(mobile ? "bottom" : "right");
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events/getAll", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data.success) {
          console.log("Fetched events:", data.data);
          setEvents(data.data);
        } else {
          console.error("Failed to fetch events:", data.error);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    if (!loading.register) return;

    if (isLoggedIn) {
      //
    } else {
      redirect("/api/auth/event/signin");
    }
  }, [loading.register, isLoggedIn]);

  const getTeamSize = (minSize: number, maxSize: number) => {
    if (minSize === maxSize) {
      return minSize === 1 ? "1" : `${minSize} members per team`;
    }
    return `${minSize} - ${maxSize} members per team`;
  };

  const getDate = (date: string) => {
    return `${new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}, ${new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const getEventAttributes = (data: Event) => {
    let teamSizeText = "";
    if (data.minTeamSize === data.maxTeamSize) {
      if (data.minTeamSize === 1)
        teamSizeText += `${data.minTeamSize} member per team`;
      else teamSizeText += `${data.minTeamSize} members per team`;
      if (data.minTeamSize === 0) teamSizeText = "";
    } else {
      teamSizeText = `${data.minTeamSize} - ${data.maxTeamSize} members per team`;
    }
    return [
      {
        name: "Date",
        text: getDate(data.date),
        Icon: CalendarDays,
      },
      {
        name: "Venue",
        text: data.venue,
        Icon: MapPin,
      },
      {
        name: "Team Size",
        text: teamSizeText,
        Icon: Users,
      },
    ];
  };

  const handleCardClick = (id: string) => {
    const event = events.find((event) => event.id === id) as Event;
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <Image
        src="/images/underwater.png"
        alt="Sea Background"
        fill
        priority
        className="object-cover -z-10"
      />
      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        direction={drawerDirection}
      >
        <DrawerContent className="bg-[#0f1823] w-full sm:min-w-2/5 p-0 rounded-l-xl border border-[#39577c]">
          <DrawerTitle
            className="text-3xl font-bold text-[#133c55] mb-4"
            asChild
          >
            <VisuallyHidden>Event Details</VisuallyHidden>
          </DrawerTitle>
          {selectedEvent ? (
            <div
              className={`flex flex-col gap-6 px-4 pb-8 overflow-y-auto flex-1 ${
                drawerDirection === "bottom" ? "pt-2" : "pt-8"
              }`}
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-[#f4d35e] wrap-break-word text-center">
                {selectedEvent?.title}
              </h2>
              {selectedEvent?.image && (
                <div className="flex justify-center relative">
                  <Image
                    src={selectedEvent.image}
                    alt={selectedEvent.title}
                    width={500}
                    height={500}
                    className="rounded-xl w-full max-w-md object-contain border border-[#f4d35e]/30 shadow"
                  />
                </div>
              )}
              <div className="text-white prose prose-headings:text-white prose-li:text-white min-w-full">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {selectedEvent.description}
                </ReactMarkdown>
              </div>
              <div className="w-full mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 text-sm md:text-md lg:text-lg justify-center items-center">
                  {[
                    {
                      label: "Venue",
                      value: selectedEvent?.venue || "TBA",
                    },
                    {
                      label: "Format",
                      value: selectedEvent?.type,
                    },
                    {
                      label: "Team Size",
                      value:
                        getTeamSize(
                          selectedEvent?.minTeamSize ?? 0,
                          selectedEvent?.maxTeamSize ?? 0,
                        ) || "N/A",
                    },
                    {
                      label: "Entry Fee",
                      value: "Free",
                    },
                    {
                      label: "Date",
                      value: getDate(selectedEvent?.date ?? "") || "TBA",
                    },
                    {
                      label: "Deadline",
                      value: (
                        <>
                          {new Date(
                            selectedEvent?.deadline ?? "",
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(
                            selectedEvent?.deadline ?? "",
                          ).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      ),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl p-2 flex flex-col items-center justify-center w-full h-full bg-linear-to-br from-[#133c55] to-[#0f1823] border border-[#f4d35e]/30 shadow-[0_0_15px_rgba(244,211,94,0.15)]"
                    >
                      <span className="font-bold text-purple-900 dark:text-purple-100 truncate">
                        {item.label}
                      </span>
                      <span className="font-normal text-purple-900 dark:text-purple-100 truncate flex">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Button
                  onClick={() => setLoading({ ...loading, register: true })}
                >
                  Register
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <p>No event selected.</p>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-wide text-[#133c55] drop-shadow-[0_0_12px_rgba(255,191,0,1)]">
            Events
          </h1>
        </div>

        {events.length > 0 ? (
          <div
            data-scroll-section
            data-scroll-speed="0.7"
            className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16 md:gap-10 gap-6 justify-center items-start"
          >
            {events.map((event) => (
              <div
                key={event.id}
                className={`relative hover:scale-[1.01] hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out cursor-pointer bg-[#0f1823] border border-[#39577c] px-2 rounded-2xl flex flex-col gap-2 w-full mx-auto py-2`}
              >
                <div>
                  <div className=" bg-[#133c55]  rounded-t-xl">
                    <div className="w-full">
                      <div className="-skew-x-37 bg-[#0f1823] absolute rounded-bl-3xl rounded-br-xl left-0 w-1/2 justify-start px-4">
                        <Image
                          src={"/logos/logowithglow.webp"}
                          alt={"Hackfest Logo"}
                          width={550}
                          height={550}
                          className="object-fill -translate-y-1 translate-x-1 h-8 w-10 scale-[1.4] skew-x-35 drop-shadow-[0_0_12px_rgba(255,191,0,0.8)]"
                        />
                      </div>
                      <div
                        className={`tracking-widest uppercase font-extrabold flex justify-end pt-1 pr-2 text-[#f4d35e]`}
                      >
                        {event.type === "Solo" ? "Individual" : "Team"}
                      </div>
                    </div>
                  </div>
                  <div className=" bg-[#133c55]  rounded-b-xl rounded-tl-xl justify-end items-end right-0">
                    <div className={`rounded-xl object-fill p-2`}>
                      {event.image && (
                        <Image
                          src={event.image}
                          alt={event.title}
                          width={250}
                          height={250}
                          className="object-cover rounded-xl h-full w-full border border-[#f4d35e]/30 shadow-inner"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-2xl text-[#f4d35e] text-center font-bold tracking-wide">
                  {event.title}
                </div>
                <div className="flex flex-col w-full gap-2 text-white px-1 py-3 justify-center items-start md:w-full h-36">
                  {getEventAttributes(event).map((attr) =>
                    attr.name ? (
                      <div
                        className="w-full flex items-center border border-[#f4d35e]/20 gap-2 text-left bg-[#1c4966]/30 p-1 rounded-xl backdrop-blur-sm px-2"
                        key={attr.name}
                      >
                        <attr.Icon />
                        <span
                          suppressHydrationWarning
                          className="text-sm truncate"
                        >
                          {attr.text}
                        </span>
                      </div>
                    ) : null,
                  )}
                </div>
                <div className="w-full mt-2">
                  <Button
                    onClick={() => handleCardClick(event.id)}
                    className="cursor-pointer tracking-wider text-lg text-[#0b2545] capitalize shrink-0 w-full py-2 flex gap-2 items-center justify-center rounded-full bg-linear-to-r from-[#cfb536] to-[#c2a341] hover:brightness-110 hover:scale-[1.02] transition-all duration-300"
                  >
                    <Compass size={20} />
                    Set Sail
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center">
            <div className="w-full max-w-md flex flex-col bg-black/30 p-10 rounded-xl gap-5 justify-center items-center text-center text-white text-xl border border-primary-200/80">
              <TriangleAlert size={50} />
              No events found
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
