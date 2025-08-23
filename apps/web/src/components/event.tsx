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
  Users,
} from "lucide-react";
import { cn, dateFormat } from "@/lib/utils";
import { useLocation } from "react-router";
import { Button } from "./ui/button";
import EditEvent from "./edit-event";
import { toastError, toastInfo, toastSuccess } from "@/utils/toastWrapper";

const Event = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { currentEvent, isLoading, error, fetchEvent, updateEvent } =
    useEventStore();
  const [editOpen, setEditOpen] = useState(false);

  const getCategoryLabel = (category?: string) => {
    if (!category) return "";
    const categoryItem = EVENT_CATEGORIES.find((cat) => cat.value === category);
    return categoryItem ? categoryItem.label : category;
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
    return <Loader2Icon className="mx-auto animate-spin" />;
  }

  if (error?.type === "NOT_FOUND") {
    return <Navigate to="/404" replace />;
  }

  if (!currentEvent) {
    return <div></div>;
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
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
        <span
          className={cn(
            "size-fit rounded-full px-4 py-2 text-sm font-semibold select-none sm:text-base",
            currentEvent.status === "DRAFT" && "bg-info/20 text-info",
            currentEvent.status === "PUBLISHED" && "bg-success/20 text-success",
            currentEvent.status === "CANCELLED" &&
              "bg-destructive/20 text-destructive",
          )}
        >
          {currentEvent.status}
        </span>
      </div>
      <p>{currentEvent.description}</p>
      <div className="grid grid-cols-1 place-items-start gap-4 text-lg lg:grid-cols-2">
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-2">
            <MapPin />
            <span className="font-semibold">Location:</span>
          </div>
          <span>{currentEvent.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock />
            <span className="font-semibold">Date:</span>
          </div>
          <span>
            {dateFormat(currentEvent.start_date, currentEvent.end_date)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Users />
            <span className="font-semibold">Capacity:</span>
          </div>
          <span>{currentEvent.capacity}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Banknote />
            <span className="font-semibold">Price:</span>
          </div>
          <span>${Number(currentEvent.ticket_price).toFixed(2)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h2>Tickets</h2>
        <div className="flex flex-col gap-1">
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
      <EditEvent open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
};

export default Event;
