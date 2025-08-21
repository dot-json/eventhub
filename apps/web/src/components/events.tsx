import { SquareArrowOutUpRight } from "lucide-react";
import { Button } from "./ui/button";

interface MyEventProps {
  title: string;
  description: string;
  category?: string;
  start_date: string;
  end_date: string;
  capacity: number;
  tickets_remaining: number;
}

export const MyEvent = ({
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
  const dateFormat = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <div>
          <h2>{title}</h2>
          {category && (
            <p className="text-muted-foreground text-sm">{category}</p>
          )}
        </div>
        <p className="font-semibold">{`${dateFormat(start_date)} - ${dateFormat(end_date)}`}</p>
      </div>
      <p>{shortenDesc(description)}</p>
      <p className="text-lg font-semibold">
        Tickets sold: {capacity - tickets_remaining} out of {capacity}
      </p>
      <Button className="w-fit">
        <SquareArrowOutUpRight />
        View Details
      </Button>
    </div>
  );
};
