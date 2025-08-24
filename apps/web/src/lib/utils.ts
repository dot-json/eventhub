import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
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
    return `${format(startDate, "yyyy MMM dd, h:mm a")} - ${format(endDate, "h:mm a")}`;
  } else if (
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth()
  ) {
    return `${format(startDate, "yyyy MMM dd, h:mm a")} - ${format(endDate, "dd, h:mm a")}`;
  } else if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${format(startDate, "yyyy MMM dd, h:mm a")} - ${format(endDate, "MMM dd, h:mm a")}`;
  }

  return `${format(startDate, "yyyy MMM dd, h:mm a")} - ${format(endDate, "yyyy MMM dd, h:mm a")}`;
};
