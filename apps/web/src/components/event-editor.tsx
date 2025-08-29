import { Button } from "./ui/button";
import { CalendarIcon, Loader2Icon, Plus, SquarePen } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useEventStore, EVENT_CATEGORIES } from "@/stores/eventStore";
import type { EventCategory } from "@/stores/eventStore";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { toastError, toastSuccess } from "@/utils/toastWrapper";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format, addDays, set } from "date-fns";
import { useNavigate } from "react-router";

interface EditEventProps {
  open: boolean;
  onClose: () => void;
  mode: "edit" | "create";
}

interface FormData {
  title: string;
  description: string;
  category: EventCategory | "none";
  location: string;
  start_date: Date | null;
  end_date: Date | null;
  capacity: number;
  ticket_price: string;
}

const EventEditor = ({ open, onClose, mode }: EditEventProps) => {
  const navigate = useNavigate();
  const { currentEvent, updateEvent, createEvent, deleteEvent, isLoading } =
    useEventStore();
  const [dateOpen, setDateOpen] = useState<{ start: boolean; end: boolean }>({
    start: false,
    end: false,
  });

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
      start_date: set(new Date(), {
        hours: 9,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
      end_date: addDays(
        set(new Date(), { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 }),
        1,
      ),
      capacity: 1,
      ticket_price: "0.00",
    },
  });

  useEffect(() => {
    if (mode === "edit" && currentEvent && open) {
      reset({
        title: currentEvent.title,
        description: currentEvent.description,
        category: currentEvent.category || "none",
        location: currentEvent.location,
        start_date: currentEvent.start_date
          ? new Date(currentEvent.start_date)
          : null,
        end_date: currentEvent.end_date
          ? new Date(currentEvent.end_date)
          : null,
        capacity: currentEvent.capacity,
        ticket_price: Number(currentEvent.ticket_price).toFixed(2),
      });
    }
  }, [currentEvent, open, reset]);

  const onSubmit = async (data: FormData) => {
    if (mode === "edit") {
      if (!currentEvent) return;

      const updateEventPayload = {
        title: data.title,
        description: data.description,
        category: data.category === "none" ? undefined : data.category,
        location: data.location,
        start_date: data.start_date?.toISOString(),
        end_date: data.end_date?.toISOString(),
        capacity: data.capacity,
        ticket_price: parseFloat(data.ticket_price),
      };

      try {
        const result = await updateEvent(currentEvent.id, updateEventPayload);
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
    } else if (mode === "create") {
      const createEventPayload = {
        title: data.title,
        description: data.description,
        category: data.category === "none" ? undefined : data.category,
        location: data.location,
        start_date: data.start_date!.toISOString(),
        end_date: data.end_date!.toISOString(),
        capacity: data.capacity,
        ticket_price: parseFloat(data.ticket_price),
      };

      try {
        const result = await createEvent(createEventPayload);
        if ("error" in result) {
          toastError(result.error.message);
        } else {
          toastSuccess(result.message);
          onClose();
          navigate(`/events/${result.event.id}`);
        }
      } catch (error) {
        console.log("Create error:", error);
        toastError("Failed to create event");
      }
    }
  };

  const onDelete = async () => {
    if (!currentEvent) return;

    try {
      const result = await deleteEvent(currentEvent.id);
      if ("error" in result) {
        toastError(result.error.message);
      } else {
        toastSuccess(result.message);
        onClose();
        navigate("/my-events");
      }
    } catch (error) {
      console.log("Delete error:", error);
      toastError("Failed to delete event");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl [&>button]:top-5.5 [&>button]:right-5.5">
        <DialogHeader className="text-2xl leading-5 font-bold">
          {mode === "edit" ? "Edit Event" : "Create Event"}
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
            <div className="col-span-2 grid gap-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input
                id="event-name"
                {...register("title", { required: "Event name is required" })}
              />
              {errors.title && (
                <span className="text-destructive text-sm">
                  {errors.title.message}
                </span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-category">Category</Label>
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
              <span className="text-destructive text-sm">
                {errors.description.message}
              </span>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-location">Location</Label>
            <Input
              id="event-location"
              {...register("location", { required: "Location is required" })}
            />
            {errors.location && (
              <span className="text-destructive text-sm">
                {errors.location.message}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="event-location">Start Date</Label>
                <Controller
                  name="start_date"
                  control={control}
                  rules={{ required: "Start date is required" }}
                  render={({ field }) => (
                    <Popover
                      open={dateOpen.start}
                      onOpenChange={(open) =>
                        setDateOpen((prev) => ({ ...prev, start: open }))
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          data-empty={!field.value}
                          className="data-[empty=true]:text-muted-foreground justify-start text-left font-normal"
                        >
                          <CalendarIcon />
                          {field.value ? (
                            format(field.value, "PP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(selectedDate) => {
                            if (selectedDate) {
                              if (field.value) {
                                const newDate = new Date(selectedDate);
                                newDate.setHours(field.value.getHours());
                                newDate.setMinutes(field.value.getMinutes());
                                newDate.setSeconds(field.value.getSeconds());
                                field.onChange(newDate);
                              } else {
                                const newDate = new Date(selectedDate);
                                newDate.setHours(9);
                                newDate.setMinutes(0);
                                newDate.setSeconds(0);
                                field.onChange(newDate);
                              }
                            }
                            setDateOpen((prev) => ({ ...prev, start: false }));
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time-picker">Time</Label>
                <Controller
                  name="start_date"
                  control={control}
                  rules={{ required: "Start time is required" }}
                  render={({ field }) => (
                    <Input
                      type="time"
                      id="time-picker"
                      step="1"
                      value={
                        field.value && !isNaN(field.value.getTime())
                          ? format(field.value, "HH:mm:ss")
                          : "09:00:00"
                      }
                      onChange={(e) => {
                        const timeValue = e.target.value;

                        if (
                          !/^\d{1,2}(:\d{1,2})?(:\d{1,2})?$/.test(timeValue)
                        ) {
                          return;
                        }

                        const [hours, minutes, seconds = "00"] =
                          timeValue.split(":");

                        const h = parseInt(hours, 10);
                        const m = parseInt(minutes || "0", 10);
                        const s = parseInt(seconds, 10);

                        if (
                          h < 0 ||
                          h > 23 ||
                          m < 0 ||
                          m > 59 ||
                          s < 0 ||
                          s > 59
                        ) {
                          return;
                        }

                        if (field.value && !isNaN(field.value.getTime())) {
                          const newDate = new Date(field.value);
                          newDate.setHours(h);
                          newDate.setMinutes(m);
                          newDate.setSeconds(s);
                          field.onChange(newDate);
                        } else {
                          const newDate = new Date();
                          newDate.setHours(h);
                          newDate.setMinutes(m);
                          newDate.setSeconds(s);
                          field.onChange(newDate);
                        }
                      }}
                      className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="event-location">End Date</Label>
                <Controller
                  name="end_date"
                  control={control}
                  rules={{ required: "End date is required" }}
                  render={({ field }) => (
                    <Popover
                      open={dateOpen.end}
                      onOpenChange={(open) =>
                        setDateOpen((prev) => ({ ...prev, end: open }))
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          data-empty={!field.value}
                          className="data-[empty=true]:text-muted-foreground justify-start text-left font-normal"
                        >
                          <CalendarIcon />
                          {field.value ? (
                            format(field.value, "PP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(selectedDate) => {
                            if (selectedDate) {
                              if (field.value) {
                                const newDate = new Date(selectedDate);
                                newDate.setHours(field.value.getHours());
                                newDate.setMinutes(field.value.getMinutes());
                                newDate.setSeconds(field.value.getSeconds());
                                field.onChange(newDate);
                              } else {
                                const newDate = new Date(selectedDate);
                                newDate.setHours(17);
                                newDate.setMinutes(0);
                                newDate.setSeconds(0);
                                field.onChange(newDate);
                              }
                            }
                            setDateOpen((prev) => ({ ...prev, end: false }));
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time-picker">Time</Label>
                <Controller
                  name="end_date"
                  control={control}
                  rules={{ required: "End time is required" }}
                  render={({ field }) => (
                    <Input
                      type="time"
                      id="time-picker"
                      step="1"
                      value={
                        field.value && !isNaN(field.value.getTime())
                          ? format(field.value, "HH:mm:ss")
                          : "17:00:00"
                      }
                      onChange={(e) => {
                        const timeValue = e.target.value;

                        if (
                          !/^\d{1,2}(:\d{1,2})?(:\d{1,2})?$/.test(timeValue)
                        ) {
                          return;
                        }

                        const [hours, minutes, seconds = "00"] =
                          timeValue.split(":");

                        const h = parseInt(hours, 10);
                        const m = parseInt(minutes || "0", 10);
                        const s = parseInt(seconds, 10);

                        if (
                          h < 0 ||
                          h > 23 ||
                          m < 0 ||
                          m > 59 ||
                          s < 0 ||
                          s > 59
                        ) {
                          return;
                        }

                        if (field.value && !isNaN(field.value.getTime())) {
                          const newDate = new Date(field.value);
                          newDate.setHours(h);
                          newDate.setMinutes(m);
                          newDate.setSeconds(s);
                          field.onChange(newDate);
                        } else {
                          const newDate = new Date();
                          newDate.setHours(h);
                          newDate.setMinutes(m);
                          newDate.setSeconds(s);
                          field.onChange(newDate);
                        }
                      }}
                      className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                  )}
                />
              </div>
            </div>
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
                <span className="text-destructive text-sm">
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
                <span className="text-destructive text-sm">
                  {errors.ticket_price.message}
                </span>
              )}
            </div>
          </div>
          {mode === "edit" ? (
            <div className="flex items-center justify-between">
              <Button type="submit" disabled={isLoading} className="mt-2 w-fit">
                {isLoading ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <SquarePen />
                )}
                {isLoading ? "Updating..." : "Update Event"}
              </Button>
              <Button type="button" variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            </div>
          ) : (
            <Button type="submit" className="w-fit">
              <Plus />
              Create Event
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventEditor;
