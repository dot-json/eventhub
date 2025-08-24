import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EVENT_CATEGORIES,
  useEventStore,
  type EventCategory,
} from "@/stores/eventStore";
import { toastError } from "@/utils/toastWrapper";
import { format, set } from "date-fns";
import { CalendarIcon, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { PublicEvent } from "@/components/events";

interface QueryFormData {
  search: string;
  category: EventCategory | "any";
  start_date: Date | null;
  end_date: Date | null;
  sort_by: "date_asc" | "date_desc" | "ticket_price_asc" | "ticket_price_desc";
}

const PublicEventsPage = () => {
  const { events, fetchEvents } = useEventStore();

  const {
    register,
    handleSubmit,
    reset,
    resetField,
    getValues,
    control,
    trigger,
    formState: { errors },
  } = useForm<QueryFormData>({
    defaultValues: {
      search: "",
      category: "any",
      start_date: null,
      end_date: null,
      sort_by: "date_desc",
    },
  });
  const watchedSearch = useWatch({ control, name: "search" });
  const watchedCategory = useWatch({ control, name: "category" });
  const watchedStartDate = useWatch({ control, name: "start_date" });
  const watchedEndDate = useWatch({ control, name: "end_date" });
  const watchedSortBy = useWatch({ control, name: "sort_by" });

  useEffect(() => {
    const refetchEvents = async () => {
      try {
        const result = await fetchEvents();
        if ("error" in result) {
          toastError(result.error.message);
        }
      } catch (error) {
        console.error("Error refetching events:", error);
      }
    };

    refetchEvents();
  }, [
    watchedCategory,
    watchedStartDate,
    watchedEndDate,
    watchedSortBy,
    fetchEvents,
  ]);

  const handleSearchSubmit = async () => {
    try {
      const result = await fetchEvents();
      if ("error" in result) {
        toastError(result.error.message);
      }
    } catch (error) {
      console.error("Error searching events:", error);
    }
  };

  const [dateOpen, setDateOpen] = useState<{ start: boolean; end: boolean }>({
    start: false,
    end: false,
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <h1>Public Events</h1>
      <div className="grid grid-cols-3 grid-rows-2 items-end gap-4 sm:grid-cols-5 sm:grid-rows-1">
        <div className="col-span-2 grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">Search in</Label>
            {watchedSearch && (
              <button
                className="cursor-pointer"
                onClick={() => {
                  resetField("search");
                }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="grid">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit();
              }}
              className="grid"
            >
              <Input
                placeholder="Names, descriptions, locations..."
                className="[grid-area:1/1]"
                {...register("search")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
              />
              <Button
                type="submit"
                variant="outline"
                size="icon"
                className="hover:text-foreground z-10 justify-self-end border-none !bg-transparent [grid-area:1/1] hover:bg-transparent"
              >
                <Search className="size-5" />
              </Button>
            </form>
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">Category</Label>
            {watchedCategory && watchedCategory !== "any" && (
              <button
                className="cursor-pointer"
                onClick={() => {
                  resetField("category");
                }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
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
                    <SelectItem value="any">Any</SelectItem>
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
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">Start Date</Label>
            {watchedStartDate && (
              <button
                className="cursor-pointer"
                onClick={() => {
                  setDateOpen((prev) => ({ ...prev, start: false }));
                  resetField("start_date");
                }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
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
                <PopoverTrigger asChild className="w-full overflow-hidden">
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
                        const formattedDate = set(selectedDate, {
                          hours: 0,
                          minutes: 0,
                          seconds: 0,
                        });
                        const endDate = getValues("end_date");
                        if (endDate !== null && formattedDate <= endDate) {
                          field.onChange(formattedDate);
                        } else if (endDate === null) {
                          field.onChange(formattedDate);
                        } else {
                          toastError("Start date must be before end date");
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
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">End Date</Label>
            {watchedEndDate && (
              <button
                className="cursor-pointer"
                onClick={() => {
                  setDateOpen((prev) => ({ ...prev, end: false }));
                  resetField("end_date");
                }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Controller
            name="end_date"
            control={control}
            rules={{
              required: "End date is required",
              validate: {
                isAfterStartDate: (value) => {
                  if (!value) return true;
                  const startDate = getValues("start_date");
                  return startDate && value <= startDate
                    ? "End date must be after start date"
                    : true;
                },
              },
            }}
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
                        const formattedDate = set(selectedDate, {
                          hours: 23,
                          minutes: 59,
                          seconds: 59,
                        });
                        const startDate = getValues("start_date");
                        if (startDate !== null && formattedDate >= startDate) {
                          field.onChange(formattedDate);
                        } else if (startDate === null) {
                          field.onChange(formattedDate);
                        } else {
                          toastError("End date must be after start date");
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
      </div>
      <section className="flex flex-col gap-6">
        {events.map((event) => (
          <PublicEvent key={event.id} {...event} />
        ))}
      </section>
    </div>
  );
};

export default PublicEventsPage;
