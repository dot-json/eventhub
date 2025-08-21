import { MyEvent } from "@/components/events";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEventStore } from "@/stores/eventStore";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";

const MyEventsPage = () => {
  const { getGroupedMyEvents, fetchMyEvents, isLoading, error } =
    useEventStore();
  const groupedMyEvents = getGroupedMyEvents();

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <h1>My Events</h1>

      {isLoading && <Loader2Icon className="mx-auto animate-spin" />}
      {error && <div className="text-red-500">Error: {error}</div>}

      {!isLoading && !error && (
        <>
          {groupedMyEvents.live.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="flex items-center gap-3">
                <div className="dot animate-ripple"></div>
                <span>Live Now</span>
              </h2>
              <div className="flex flex-col gap-4">
                {groupedMyEvents.live.map((event) => (
                  <MyEvent key={event.id} {...event} />
                ))}
              </div>
            </div>
          )}
          <Accordion
            type="multiple"
            className="w-full"
            defaultValue={["item-1"]}
          >
            <AccordionItem value="item-1">
              <AccordionTrigger>
                Upcoming Events ({groupedMyEvents.upcoming.length})
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4">
                {groupedMyEvents.upcoming.map((event) => (
                  <MyEvent key={event.id} {...event} />
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>
                Past Events ({groupedMyEvents.past.length})
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4">
                {groupedMyEvents.past.map((event) => (
                  <MyEvent key={event.id} {...event} />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}
    </div>
  );
};

export default MyEventsPage;
