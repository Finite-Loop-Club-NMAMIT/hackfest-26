import { CalendarDays, MapPin, User, Users } from "lucide-react";
import type { Event } from "./layout";

export const getTeamSize = (minSize: number, maxSize: number) => {
  if (minSize === maxSize) {
    return minSize === 1
      ? "1"
      : `${minSize} member${minSize === 1 ? "" : "s"} per team`;
  }
  return `${minSize} - ${maxSize} members per team`;
};

export const getDate = (from: string, to: string) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const fromDateStr = fromDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const fromTimeStr = fromDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const toDateStr = toDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const toTimeStr = toDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (fromDateStr === toDateStr) {
    return `${fromDateStr}, ${fromTimeStr} - ${toTimeStr}`;
  }
  return `${fromDateStr}, ${fromTimeStr} - ${toDateStr}, ${toTimeStr}`;
};

export const getEventAttributes = (data: Event) => {
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
      text: getDate(data.from, data.to),
      Icon: CalendarDays,
    },
    {
      name: "Venue",
      text: data.venue,
      Icon: MapPin,
    },
    {
      name: "Audience",
      text:
        data.audience === "Participants"
          ? "Hackfest participants Only"
          : data.audience === "Non-Participants"
            ? "Hackfest non-participants Only"
            : "Open to All",
      Icon: User,
    },
    {
      name: "Team Size",
      text: teamSizeText,
      Icon: Users,
    },
  ];
};
