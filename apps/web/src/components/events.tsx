import { SquareArrowOutUpRight } from "lucide-react";
import { Button } from "./ui/button";

export const MyEvent = () => {
  const shortenDesc = (text: string) => {
    return text.length > 124 ? text.slice(0, 124) + "..." : text;
  };

  const desc =
    "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Vel cum porro tempora enim dolor, eum dolores saepe laudantium architecto nam. Culpa ipsum officiis corrupti illum qui minus ducimus repellendus atque. Culpa ipsum officiis corrupti illum qui minus ducimus repellendus atque.";

  return (
    <div className="flex flex-col gap-3 rounded-md border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <div>
          <h2>Event Title</h2>
          <p className="font-light">
            From <span className="font-medium">Organizer Name</span>
          </p>
        </div>
        <p className="font-semibold">2025/01/01 - 2025/01/02</p>
      </div>
      <p>{shortenDesc(desc)}</p>
      <p className="text-lg font-semibold">Tickets sold: 125 out of 340</p>
      <Button className="w-fit">
        <SquareArrowOutUpRight />
        View Details
      </Button>
    </div>
  );
};
