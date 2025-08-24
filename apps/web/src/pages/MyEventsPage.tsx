import EventEditor from "@/components/event-editor";
import { MyEvent } from "@/components/events";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useEventStore } from "@/stores/eventStore";
import { Loader2Icon, Plus } from "lucide-react";
import { useEffect, useState } from "react";

const MyEventsPage = () => {
  const {
    getGroupedMyEvents,
    fetchMyEvents,
    isLoading,
    error,
    clearCurrentEvent,
  } = useEventStore();
  const groupedMyEvents = getGroupedMyEvents();
  const [createEventOpen, setCreateEventOpen] = useState(false);

  useEffect(() => {
    clearCurrentEvent();
    fetchMyEvents();
  }, [fetchMyEvents]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between">
        <h1>My Events</h1>
        <Button onClick={() => setCreateEventOpen(true)}>
          <Plus />
          Create Event
        </Button>
      </div>

      {isLoading && <Loader2Icon className="mx-auto animate-spin" />}

      {!isLoading && !error && (
        <>
          {groupedMyEvents.live.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="flex items-center gap-3">
                <div className="dot animate-ripple"></div>
                <span>Live Now</span>
              </h2>
              <div className="flex flex-col gap-6">
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
              <AccordionContent className="flex flex-col gap-6">
                {groupedMyEvents.upcoming.map((event) => (
                  <MyEvent key={event.id} {...event} />
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>
                Past Events ({groupedMyEvents.past.length})
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-6">
                {groupedMyEvents.past.map((event) => (
                  <MyEvent key={event.id} {...event} />
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>
                Drafts ({groupedMyEvents.drafts.length})
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-6">
                {groupedMyEvents.drafts.map((event) => (
                  <MyEvent key={event.id} {...event} />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}
      <EventEditor
        open={createEventOpen}
        onClose={() => setCreateEventOpen(false)}
        mode="create"
      />
    </div>
  );
};

export default MyEventsPage;
