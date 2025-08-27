import { cn, dateFormat } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { useTheme } from "./theme-provider";
import type { Ticket } from "@/stores/ticketStore";
import { CalendarClock, MapPin } from "lucide-react";
import { Button } from "./ui/button";

const TicketComponent = ({
  hash,
  used_at,
  event,
  onOpen,
}: Omit<
  Ticket & { onOpen?: () => void | undefined },
  "id" | "user_id" | "event_id" | "created_at" | "updated_at"
>) => {
  const { theme } = useTheme();
  return (
    <div
      className={cn(
        "relative grid grid-cols-[auto_1fr] overflow-hidden",
        used_at && "gap-4",
        onOpen !== undefined && "cursor-pointer",
      )}
      onClick={onOpen}
    >
      <div
        className={cn(
          "bg-card relative grid size-32 place-items-center overflow-hidden p-3 sm:size-56 sm:p-6",
          used_at
            ? "full-border-shadow"
            : "ticket-square-inner-border after:border-border after:absolute after:right-0 after:h-full after:border-r after:border-dashed",
        )}
      >
        <span
          className={cn(
            "pointer-events-none size-full [grid-area:1/1]",
            "before:bg-background before:border-border before:absolute before:top-0 before:left-0 before:z-10 before:size-8 before:-translate-1/2 before:rounded-full before:border sm:before:size-12",
            "after:bg-background after:border-border after:absolute after:bottom-0 after:left-0 after:z-10 after:size-8 after:-translate-x-1/2 after:translate-y-1/2 after:rounded-full after:border sm:after:size-12",
          )}
        ></span>
        <span
          className={cn(
            "pointer-events-none size-full [grid-area:1/1]",
            "before:bg-background before:border-border before:absolute before:top-0 before:right-0 before:z-10 before:size-8 before:translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:border sm:before:size-12",
            "after:bg-background after:border-border after:absolute after:right-0 after:bottom-0 after:z-10 after:size-8 after:translate-x-1/2 after:translate-y-1/2 after:rounded-full after:border sm:after:size-12",
          )}
        ></span>
        <div className="grid size-full place-items-center [grid-area:1/1]">
          <div
            className={cn(
              "grid size-full p-2 [grid-area:1/1]",
              !used_at && "blur-[2px]",
            )}
          >
            {used_at && (
              <div className="z-20 grid size-full place-items-center [grid-area:1/1]">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 200 65"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-card"
                >
                  <polyline
                    points="-8,58.5 66.67,6.5 133.33,58.5 208,6.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="25"
                  />
                </svg>
              </div>
            )}
            <QRCodeSVG
              value={hash}
              bgColor="transparent"
              fgColor={theme === "dark" ? "#dcdcdc" : "#3a3a3a"}
              level="L"
              marginSize={0}
              style={{ background: "transparent" }}
              className="size-full [grid-area:1/1]"
            />
          </div>
          {used_at === null && (
            <Button variant="secondary" className="z-20 [grid-area:1/1]">
              Open
            </Button>
          )}
        </div>
      </div>
      <div
        className={cn(
          "bg-card relative flex w-full flex-col gap-4 overflow-hidden p-3 px-5 sm:p-6 sm:px-8",
          used_at ? "full-border-shadow" : "ticket-rect-inner-border",
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute inset-0 size-full",
            "before:bg-background before:border-border before:absolute before:top-0 before:left-0 before:z-10 before:size-8 before:-translate-1/2 before:rounded-full before:border sm:before:size-12",
            "after:bg-background after:border-border after:absolute after:bottom-0 after:left-0 after:z-10 after:size-8 after:-translate-x-1/2 after:translate-y-1/2 after:rounded-full after:border sm:after:size-12",
          )}
        ></span>
        <span
          className={cn(
            "pointer-events-none absolute inset-0 size-full",
            "before:bg-background before:border-border before:absolute before:top-0 before:right-0 before:z-10 before:size-8 before:translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:border sm:before:size-12",
            "after:bg-background after:border-border after:absolute after:right-0 after:bottom-0 after:z-10 after:size-8 after:translate-x-1/2 after:translate-y-1/2 after:rounded-full after:border sm:after:size-12",
          )}
        ></span>
        <div className="flex flex-1 justify-between gap-2 sm:flex-col">
          <div className="flex flex-col gap-1">
            <h2 className="text-base sm:text-2xl">{event.title}</h2>
            <p className="text-muted-foreground flex items-start gap-1.5 text-xs sm:gap-2 sm:text-base">
              <MapPin className="size-4 sm:size-5" />
              {event.location}
            </p>
            <p className="text-muted-foreground flex items-start gap-1.5 text-xs sm:gap-2 sm:text-base">
              <CalendarClock className="size-4 sm:size-5" />
              {dateFormat(event.start_date, event.end_date)}
            </p>
          </div>
          <p className="text-xl font-semibold sm:text-3xl">
            ${event.ticket_price}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketComponent;
