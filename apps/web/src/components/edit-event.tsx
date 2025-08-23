import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Loader2Icon, SquarePen, X } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useEventStore, EVENT_CATEGORIES } from "@/stores/eventStore";
import type { EventCategory } from "@/stores/eventStore";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toastError, toastSuccess } from "@/utils/toastWrapper";

interface EditEventProps {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  title: string;
  description: string;
  category: EventCategory | "none";
  location: string;
  capacity: number;
  ticket_price: string;
}

const EditEvent = ({ open, onClose }: EditEventProps) => {
  const { currentEvent, updateEvent, isUpdating } = useEventStore();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      category: "none",
      location: "",
      capacity: 0,
      ticket_price: "0.00",
    },
  });

  useEffect(() => {
    if (currentEvent && open) {
      reset({
        title: currentEvent.title,
        description: currentEvent.description,
        category: currentEvent.category || "none",
        location: currentEvent.location,
        capacity: currentEvent.capacity,
        ticket_price: Number(currentEvent.ticket_price).toFixed(2),
      });
    }
  }, [currentEvent, open, reset]);

  const onSubmit = async (data: FormData) => {
    if (!currentEvent) return;

    const updatePayload = {
      title: data.title,
      description: data.description,
      category: data.category === "none" ? undefined : data.category,
      location: data.location,
      capacity: data.capacity,
      ticket_price: parseFloat(data.ticket_price),
    };

    try {
      const result = await updateEvent(currentEvent.id, updatePayload);
      if ("error" in result) {
        toastError(result.error.message);
      } else {
        toastSuccess(result.message);
        onClose();
      }
    } catch (error) {
      console.log("Update error:", error);
      toastError("Failed to update event");
    }
  };

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[771] grid place-items-start opacity-0 transition-opacity sm:place-items-center",
        open && "pointer-events-auto opacity-100",
      )}
    >
      <div
        className="z-[771] hidden size-full bg-black/50 [grid-area:1/1] sm:block"
        onClick={onClose}
      />
      <div
        className={cn(
          "bg-background z-[771] mt-[calc(4rem+1px)] flex size-full max-h-[90vh] w-full flex-col overflow-scroll transition-transform duration-250 [grid-area:1/1] sm:m-0 sm:h-fit sm:max-w-2xl sm:rounded-xl sm:border",
          open ? "scale-100" : "scale-80",
        )}
      >
        <div className="bg-background sticky top-0 z-10 flex items-center justify-between p-4">
          <h2>Edit Event</h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X />
          </Button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 p-4 pt-0">
          <div className="grid gap-2">
            <Label htmlFor="event-name">Event Name</Label>
            <Input
              id="event-name"
              {...register("title", { required: "Event name is required" })}
            />
            {errors.title && (
              <span className="text-sm text-red-500">
                {errors.title.message}
              </span>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-desc">Description</Label>
            <Textarea
              id="event-desc"
              className="max-h-48 min-h-24"
              {...register("description", {
                required: "Description is required",
                minLength: {
                  value: 10,
                  message: "Description must be at least 10 characters",
                },
                maxLength: {
                  value: 1000,
                  message: "Description must be at most 1000 characters",
                },
              })}
            />
            {errors.description && (
              <span className="text-sm text-red-500">
                {errors.description.message}
              </span>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-category">Category</Label>
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="none">None</SelectItem>
                        {EVENT_CATEGORIES.map((category, id) => (
                          <SelectItem key={id} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-location">Location</Label>
            <Input
              id="event-location"
              {...register("location", { required: "Location is required" })}
            />
            {errors.location && (
              <span className="text-sm text-red-500">
                {errors.location.message}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="event-capacity">Capacity</Label>
              <Input
                id="event-capacity"
                type="number"
                min="1"
                {...register("capacity", {
                  required: "Capacity is required",
                  min: { value: 1, message: "Capacity must be at least 1" },
                  valueAsNumber: true,
                })}
              />
              {errors.capacity && (
                <span className="text-sm text-red-500">
                  {errors.capacity.message}
                </span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-price">Ticket Price ($)</Label>
              <Input
                id="event-price"
                type="number"
                min="0"
                step="0.01"
                {...register("ticket_price", {
                  required: "Ticket price is required",
                  pattern: {
                    value: /^\d+(\.\d{1,2})?$/,
                    message: "Please enter a valid price (e.g., 123.45)",
                  },
                  min: { value: 0, message: "Price cannot be negative" },
                })}
              />
              {errors.ticket_price && (
                <span className="text-sm text-red-500">
                  {errors.ticket_price.message}
                </span>
              )}
            </div>
          </div>
          <Button type="submit" disabled={isUpdating} className="mt-2 w-fit">
            {isUpdating ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <SquarePen />
            )}
            {isUpdating ? "Updating..." : "Update Event"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;
