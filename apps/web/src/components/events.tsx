import { SquareArrowOutUpRight } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router";
import { dateFormat } from "@/lib/utils";

interface MyEventProps {
  id: number;
  title: string;
  description: string;
  category?: string;
  start_date: string;
  end_date: string;
  capacity: number;
  tickets_remaining: number;
}

export const MyEvent = ({
  id,
  title,
  description,
  category,
  start_date,
  end_date,
  capacity,
  tickets_remaining,
}: MyEventProps) => {
  const shortenDesc = (text: string) => {
    return text.length > 124 ? text.slice(0, 124) + "..." : text;
  };

  return (
    <div className="bg-secondary flex flex-col gap-1 rounded-2xl p-1 transition-shadow hover:shadow-md">
      <div className="bg-background flex flex-col gap-3 rounded-xl p-4 shadow-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm">{dateFormat(start_date, end_date)}</p>
            <h2>{title}</h2>
            {category && (
              <p className="text-muted-foreground/75 text-sm">{category}</p>
            )}
          </div>
          <p className="font-semibold"></p>
        </div>
        <p>{shortenDesc(description)}</p>
      </div>
      <div className="flex items-center justify-between p-2">
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
          Tickets sold: {capacity - tickets_remaining} out of {capacity}
        </p>
      </div>
    </div>
  );
};
