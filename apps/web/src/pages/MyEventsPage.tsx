import { MyEvent } from "@/components/events";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const MyEventsPage = () => {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <h1>My Events</h1>
      <div className="flex flex-col gap-4">
        <h2 className="flex items-center gap-3">
          <div className="dot animate-ripple"></div>
          <span>Live Now</span>
        </h2>
        <div className="flex flex-col gap-4">
          <MyEvent />
        </div>
      </div>
      <Accordion type="multiple" className="w-full" defaultValue={["item-1"]}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Upcoming Events</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4">
            <MyEvent />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Past Events</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4">
            <MyEvent />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default MyEventsPage;
