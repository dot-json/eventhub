import { MapPin, SquareArrowOutUpRight, Tags } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router";
import { dateFormat } from "@/lib/utils";
import { EVENT_CATEGORIES } from "@/stores/eventStore";

interface MyEventProps {
  id: number;
  title: string;
  description: string;
  category?: string;
  start_date: string;
  end_date: string;
  capacity: number;
  tickets_sold: number;
}

export const MyEvent = ({
  id,
  title,
  description,
  category,
  start_date,
  end_date,
  capacity,
  tickets_sold,
}: MyEventProps) => {
  const shortenDesc = (text: string) => {
    return text.length > 124 ? text.slice(0, 124) + "..." : text;
  };
  const getCategoryLabel = (category?: string) => {
    if (!category) return "";
    const categoryItem = EVENT_CATEGORIES.find((cat) => cat.value === category);
    return categoryItem ? categoryItem.label : category;
  };

  return (
    <div className="bg-secondary flex flex-col gap-1 rounded-2xl p-1 transition-shadow hover:shadow-md">
      <div className="bg-background flex flex-col gap-3 rounded-xl p-4 shadow-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm">{dateFormat(start_date, end_date)}</p>
            <h2>{title}</h2>
            {category && (
              <p className="text-muted-foreground/75 flex items-center gap-1 text-sm">
                <Tags className="size-4" />
                {getCategoryLabel(category)}
              </p>
            )}
          </div>
          <p className="font-semibold"></p>
        </div>
        <p>{shortenDesc(description)}</p>
      </div>
      <div className="flex items-center justify-between gap-4 p-2">
        <Link
          to={`/events/${id}`}
          className="w-fit"
          state={{ fromLink: "/my-events" }}
        >
          <Button className="w-fit">
            <SquareArrowOutUpRight />
            View Details
          </Button>
        </Link>
        <p className="text-sm font-semibold sm:text-base">
          {capacity - tickets_sold} tickets left
        </p>
      </div>
    </div>
  );
};

export const PublicEvent = ({
  id,
  title,
  description,
  category,
  location,
  start_date,
  end_date,
  capacity,
  tickets_sold,
}: MyEventProps & { location: string }) => {
  const shortenDesc = (text: string) => {
    return text.length > 124 ? text.slice(0, 124) + "..." : text;
  };
  const getCategoryLabel = (category?: string) => {
    if (!category) return "";
    const categoryItem = EVENT_CATEGORIES.find((cat) => cat.value === category);
    return categoryItem ? categoryItem.label : category;
  };
  const isLive = () => {
    const now = new Date();
    const start = new Date(start_date);
    const end = new Date(end_date);
    return now >= start && now <= end;
  };

  return (
    <div className="bg-secondary flex flex-col gap-1 rounded-2xl p-1 transition-shadow hover:shadow-md">
      <div className="bg-background flex flex-col gap-3 rounded-xl p-4 shadow-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm">{dateFormat(start_date, end_date)}</p>
            <h2>{title}</h2>
            {category && (
              <p className="text-muted-foreground/75 mt-0.5 flex items-center gap-1 text-sm">
                <Tags className="size-4" />
                {getCategoryLabel(category)}
              </p>
            )}
            <p className="text-muted-foreground/75 mt-0.5 flex items-center gap-1 text-sm">
              <MapPin className="size-4" />
              {location}
            </p>
          </div>
          {isLive() && (
            <p className="flex h-fit items-center gap-3">
              <span className="dot animate-ripple"></span>
              <span>Live Now</span>
            </p>
          )}
        </div>
        <p>{shortenDesc(description)}</p>
      </div>
      <div className="flex items-center justify-between gap-4 p-2">
        <Link
          to={`/events/${id}`}
          className="w-fit"
          state={{ fromLink: "/events" }}
        >
          <Button className="w-fit">
            <SquareArrowOutUpRight />
            View Details
          </Button>
        </Link>
        <p className="text-sm font-semibold sm:text-base">
          {capacity - tickets_sold} tickets left
        </p>
      </div>
    </div>
  );
};
