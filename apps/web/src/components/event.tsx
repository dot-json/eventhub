import { useEffect } from "react";
import { Navigate, useParams } from "react-router";
import { useEventStore } from "@/stores/eventStore";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

const Event = () => {
  const { id } = useParams<{ id: string }>();
  const { currentEvent, isLoading, error, fetchEvent } = useEventStore();

  useEffect(() => {
    if (id) {
      const eventId = parseInt(id, 10);
      if (!isNaN(eventId)) {
        fetchEvent(eventId);
      }
    }
  }, [id, fetchEvent]);

  if (isLoading) {
    return <Loader2Icon className="mx-auto animate-spin" />;
  }

  if (error) {
    return <Navigate to="/404" replace />;
  }

  if (!currentEvent) {
    return <div></div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="leading-tight">{currentEvent.title}</h1>
          {currentEvent.category && (
            <p className="text-muted-foreground font-semibold">
              {currentEvent.category}
            </p>
          )}
        </div>
        <span
          className={cn(
            "size-fit rounded-md px-2 py-1 text-lg font-semibold select-none",
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <strong>Location:</strong> {currentEvent.location}
        </div>
        <div>
          <strong>Category:</strong> {currentEvent.category || "N/A"}
        </div>
        <div>
          <strong>Start Date:</strong>{" "}
          {new Date(currentEvent.start_date).toLocaleString()}
        </div>
        <div>
          <strong>End Date:</strong>{" "}
          {new Date(currentEvent.end_date).toLocaleString()}
        </div>
        <div>
          <strong>Capacity:</strong> {currentEvent.capacity}
        </div>
        <div>
          <strong>Tickets Remaining:</strong> {currentEvent.tickets_remaining}
        </div>
        <div>
          <strong>Price:</strong> ${currentEvent.ticket_price}
        </div>
        <div>
          <strong>Status:</strong> {currentEvent.status}
        </div>
      </div>
    </div>
  );
};

export default Event;
