import { useEffect, useState } from "react";
import { CalendarClock, Loader2Icon, MapPin } from "lucide-react";
import { useTicketStore, type Ticket } from "@/stores/ticketStore";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import TicketComponent from "@/components/ticket";
import { QRCodeSVG } from "qrcode.react";
import { useTheme } from "@/components/theme-provider";
import { dateFormat } from "@/lib/utils";

const MyTicketsPage = () => {
  const { theme } = useTheme();
  const { isLoading, error, fetchAllUserTickets, getGroupedTickets } =
    useTicketStore();
  const groupedTickets = getGroupedTickets();

  const [showTicket, setShowTicket] = useState<{
    ticket: Ticket | null;
    open: boolean;
  }>({
    ticket: null,
    open: false,
  });

  useEffect(() => {
    fetchAllUserTickets();
  }, [fetchAllUserTickets]);

  return (
    <div className="relative flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between">
        <h1>My Tickets</h1>
      </div>
      {isLoading && <Loader2Icon className="mx-auto my-12 animate-spin" />}

      {!isLoading && !error && (
        <>
          {groupedTickets.live.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="flex items-center gap-3">
                <span className="dot animate-ripple"></span>
                <span>Live Now</span>
              </h2>
              <div className="flex flex-col gap-6">
                {groupedTickets.live.map((ticket) => (
                  <TicketComponent
                    key={ticket.id}
                    hash={ticket.hash}
                    used_at={ticket.used_at}
                    event={ticket.event}
                    onOpen={() => setShowTicket({ ticket, open: true })}
                  />
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
                Upcoming Events ({groupedTickets.upcoming.length})
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-6">
                {groupedTickets.upcoming.map((ticket) => (
                  <TicketComponent
                    key={ticket.id}
                    hash={ticket.hash}
                    used_at={ticket.used_at}
                    event={ticket.event}
                    onOpen={() => setShowTicket({ ticket, open: true })}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>
                Used Tickets ({groupedTickets.used.length})
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-6">
                {groupedTickets.used.map((ticket) => (
                  <TicketComponent
                    key={ticket.id}
                    hash={ticket.hash}
                    used_at={ticket.used_at}
                    event={ticket.event}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>
                Expired Tickets ({groupedTickets.expired.length})
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-6">
                {groupedTickets.expired.map((ticket) => (
                  <TicketComponent
                    key={ticket.id}
                    hash={ticket.hash}
                    used_at={ticket.used_at}
                    event={ticket.event}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>
                Unused Tickets ({groupedTickets.unused.length})
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-6">
                {groupedTickets.unused.map((ticket) => (
                  <TicketComponent
                    key={ticket.id}
                    hash={ticket.hash}
                    used_at={ticket.used_at}
                    event={ticket.event}
                    onOpen={() => setShowTicket({ ticket, open: true })}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}
      <Dialog
        open={showTicket.open}
        onOpenChange={() =>
          setShowTicket({ ticket: showTicket.ticket, open: false })
        }
      >
        <DialogContent className="sm:max-w-md [&>button]:top-2 [&>button]:right-2">
          {showTicket.ticket && (
            <div className="flex flex-col gap-3 p-3">
              <QRCodeSVG
                value={showTicket.ticket.hash}
                bgColor="transparent"
                fgColor={theme === "dark" ? "#dcdcdc" : "#3a3a3a"}
                level="L"
                marginSize={0}
                style={{ background: "transparent" }}
                className="size-full [grid-area:1/1]"
              />
              <hr className="mt-2" />
              <h2 className="text-3xl">{showTicket.ticket.event.title}</h2>
              <p className="text-muted-foreground flex items-center gap-2 text-base">
                <MapPin className="size-5" />
                {showTicket.ticket.event.location}
              </p>
              <p className="text-muted-foreground flex items-center gap-2 text-base">
                <CalendarClock className="size-5" />
                {dateFormat(
                  showTicket.ticket.event.start_date,
                  showTicket.ticket.event.end_date,
                )}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyTicketsPage;
