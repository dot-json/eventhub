import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { useEventStore, EVENT_CATEGORIES } from "@/stores/eventStore";
import {
  Banknote,
  CalendarClock,
  ChevronLeft,
  Loader2Icon,
  MapPin,
  SquarePen,
  Tags,
  Tickets,
  TriangleAlert,
  Users,
} from "lucide-react";
import { cn, dateFormat } from "@/lib/utils";
import { useLocation } from "react-router";
import { Button } from "../components/ui/button";
import EventEditor from "../components/event-editor";
import { toastError, toastInfo, toastSuccess } from "@/utils/toastWrapper";
import { useUser } from "@/hooks/useAuth";
import PurchaseTicket from "../components/purchase-ticket";

const EventPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const {
    currentEvent,
    isLoading,
    error,
    fetchEvent,
    updateEvent,
    getUserTicketCount,
  } = useEventStore();
  const { isOrganizer, isAdmin, isCustomer } = useUser();

  const [editOpen, setEditOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const getCategoryLabel = (category?: string) => {
    if (!category) return "";
    const categoryItem = EVENT_CATEGORIES.find((cat) => cat.value === category);
    return categoryItem ? categoryItem.label : category;
  };
  const isLive = (start_date: string, end_date: string) => {
    const now = new Date();
    const start = new Date(start_date);
    const end = new Date(end_date);
    return now >= start && now <= end;
  };

  const moveTo = async (status: "DRAFT" | "PUBLISHED" | "CANCELLED") => {
    if (!currentEvent) return;
    try {
      const result = await updateEvent(currentEvent.id, { status });
      if ("error" in result) {
        toastError(result.error.message);
      } else {
        if (status === "PUBLISHED") {
          toastSuccess("Event published successfully");
        } else {
          toastInfo(`Event moved to ${status}`);
        }
      }
    } catch (error: any) {
      console.log("Update error:", error);
      toastError("Failed to update event status");
    }
  };

  useEffect(() => {
    if (id) {
      const eventId = parseInt(id, 10);
      if (!isNaN(eventId)) {
        fetchEvent(eventId).then((result) => {
          if (result && "error" in result) {
            console.log("Fetch error:", result.error);
          }
        });
      }
    }
  }, [id, fetchEvent]);

  if (isLoading) {
    return <Loader2Icon className="mx-auto my-12 animate-spin" />;
  }

  if (error?.type === "NOT_FOUND") {
    return <Navigate to="/404" replace />;
  }

  if (!currentEvent) {
    return <div></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {location.state?.fromLink && (
        <Link to={location.state.fromLink} className="w-fit">
          <Button>
            <ChevronLeft /> Back to events
          </Button>
        </Link>
      )}
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="leading-tight">{currentEvent.title}</h1>
          <p className="font-medium">{currentEvent.organizer?.org_name}</p>
          {currentEvent.category && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
              <Tags className="size-4" />
              {getCategoryLabel(currentEvent.category)}
            </p>
          )}
        </div>
        {(isOrganizer || isAdmin) && (
          <span
            className={cn(
              "size-fit rounded-full px-4 py-2 text-sm font-semibold select-none sm:text-base",
              currentEvent.status === "DRAFT" && "bg-info/20 text-info",
              currentEvent.status === "PUBLISHED" &&
                "bg-success/20 text-success",
              currentEvent.status === "CANCELLED" &&
                "bg-destructive/20 text-destructive",
            )}
          >
            {currentEvent.status}
          </span>
        )}
        {isCustomer &&
          isLive(currentEvent.start_date, currentEvent.end_date) && (
            <p className="my-1.5 flex h-fit items-center gap-3 text-sm sm:text-base">
              <span className="dot animate-ripple"></span>
              <span className="text-nowrap">Live Now</span>
            </p>
          )}
      </div>
      <p>{currentEvent.description}</p>
      <div className="grid grid-cols-1 place-items-start gap-4 sm:text-lg lg:grid-cols-2">
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-2">
            <MapPin />
            <span className="font-semibold">Location:</span>
          </div>
          <span>{currentEvent.location}</span>
        </div>
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock />
            <span className="font-semibold">Date:</span>
          </div>
          <span>
            {dateFormat(currentEvent.start_date, currentEvent.end_date)}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-2">
            <Users />
            <span className="font-semibold">Capacity:</span>
          </div>
          <span>{currentEvent.capacity}</span>
        </div>
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-2">
            <Banknote />
            <span className="font-semibold">Price:</span>
          </div>
          <span>${Number(currentEvent.ticket_price).toFixed(2)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h2>Tickets</h2>
        <div className="flex flex-col gap-2">
          <p className="text-base sm:text-lg">
            {`Sold: ${currentEvent.tickets_sold} out of ${currentEvent.capacity} (${currentEvent.capacity - currentEvent.tickets_sold} remaining)`}
          </p>
          <div className="bg-secondary h-3 w-full rounded-full">
            <div
              className="bg-primary relative h-full rounded-full"
              style={{
                width: `${(currentEvent.tickets_sold / currentEvent.capacity) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
      {(isOrganizer || isAdmin) && (
        <div className="flex items-center justify-between gap-4">
          <Button className="w-fit" onClick={() => setEditOpen(true)}>
            <SquarePen />
            Edit Event
          </Button>
          <div className="flex gap-2">
            {currentEvent.status === "PUBLISHED" && (
              <Button variant="outline" onClick={() => moveTo("DRAFT")}>
                Move to Draft
              </Button>
            )}
            {(currentEvent.status === "DRAFT" ||
              currentEvent.status === "CANCELLED") && (
              <Button variant="outline" onClick={() => moveTo("PUBLISHED")}>
                Publish Event
              </Button>
            )}
            <Button variant="destructive" onClick={() => moveTo("CANCELLED")}>
              Cancel Event
            </Button>
          </div>
        </div>
      )}
      {isCustomer && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button
            size="lg"
            className="hover:bg-primary group relative w-fit disabled:[&>span]:hidden"
            disabled={
              currentEvent.tickets_sold >= currentEvent.capacity ||
              currentEvent.status === "CANCELLED" ||
              getUserTicketCount(currentEvent) >= 5
            }
            onClick={() => setPurchaseOpen(true)}
          >
            <span className="bg-conic-grad absolute inset-0 -z-10 overflow-hidden rounded-full transition-all group-hover:-inset-1 after:absolute after:top-1/2 after:left-1/2 after:aspect-square after:w-[120%] after:-translate-x-1/2 after:-translate-y-1/2 after:animate-spin after:rounded-full"></span>
            <Tickets />
            Buy Ticket(s)
          </Button>
          {getUserTicketCount(currentEvent) > 0 &&
            getUserTicketCount(currentEvent) < 5 && (
              <span className="text-muted-foreground text-sm">
                You have {getUserTicketCount(currentEvent)} ticket(s) for this
                event
              </span>
            )}
          {getUserTicketCount(currentEvent) >= 5 && (
            <span className="text-warning flex items-center gap-1 text-xs">
              <TriangleAlert className="size-4" />
              You have reached the maximum ticket limit for this event
            </span>
          )}
        </div>
      )}
      <EventEditor
        open={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
      />
      {isCustomer && (
        <PurchaseTicket
          open={purchaseOpen}
          onClose={() => setPurchaseOpen(false)}
        />
      )}
    </div>
  );
};

export default EventPage;
