import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dateFormat = (start: string, end: string): string => {
  if (start === end) {
    return new Date(start).toLocaleDateString();
  }
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate()
  ) {
    return `${startDate.getFullYear()} ${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric" })} - ${endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric" })}`;
  } else if (
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth()
  ) {
    return `${startDate.getFullYear()} ${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { day: "numeric" })}`;
  } else if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${startDate.getFullYear()} ${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }

  return `${startDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`;
};
