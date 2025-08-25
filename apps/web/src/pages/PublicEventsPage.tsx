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
import { PublicEvent } from "@/components/events";
import { Switch } from "@/components/ui/switch";

type SortOptions =
  | "date_desc"
  | "date_asc"
  | "ticket_price_desc"
  | "ticket_price_asc";

const SORT_OPTIONS: Array<{ value: SortOptions; label: string }> = [
  { value: "date_asc", label: "Date ascending" },
  { value: "date_desc", label: "Date descending" },
  { value: "ticket_price_asc", label: "Ticket price ascending" },
  { value: "ticket_price_desc", label: "Ticket price descending" },
];

interface QueryFormData {
  search: string;
  category: EventCategory | "any";
  start_date: Date | null;
  end_date: Date | null;
  sort_by: SortOptions;
}

const PublicEventsPage = () => {
  const { events, fetchEvents } = useEventStore();

  const [filterData, setFilterData] = useState<QueryFormData>({
    search: "",
    category: "any",
    start_date: null,
    end_date: null,
    sort_by: "date_asc",
  });
  const [liveOnly, setLiveOnly] = useState(false);

  const handleSetLiveOnly = (value: boolean) => {
    // if true set the date range and make them disabled
    if (value) {
      setFilterData((prev) => ({
        ...prev,
        start_date: new Date(),
        end_date: new Date(),
      }));
    } else {
      setFilterData((prev) => ({
        ...prev,
        start_date: null,
        end_date: null,
      }));
    }
    setLiveOnly(value);
  };

  const refetchEvents = async () => {
    try {
      const filters = {
        category:
          filterData.category !== "any" ? filterData.category : undefined,
        start_date: filterData.start_date
          ? filterData.start_date.toISOString()
          : undefined,
        end_date: filterData.end_date
          ? filterData.end_date.toISOString()
          : undefined,
        sort_by: filterData.sort_by,
      };

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined),
      );

      const result = await fetchEvents(cleanFilters);
      if ("error" in result) {
        toastError(result.error.message);
      }
    } catch (error) {
      console.error("Error refetching events:", error);
    }
  };
  useEffect(() => {
    refetchEvents();
  }, [
    filterData.category,
    filterData.start_date,
    filterData.end_date,
    filterData.sort_by,
    fetchEvents,
  ]);

  const handleSearchSubmit = async () => {
    try {
      // Build filter object including search term
      const filters = {
        search: filterData.search || undefined,
        category:
          filterData.category !== "any" ? filterData.category : undefined,
        start_date: filterData.start_date
          ? filterData.start_date.toISOString()
          : undefined,
        end_date: filterData.end_date
          ? filterData.end_date.toISOString()
          : undefined,
        sort_by: filterData.sort_by,
      };

      // Remove undefined values
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined),
      );

      const result = await fetchEvents(cleanFilters);
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
      <div className="grid grid-cols-3 grid-rows-2 items-end gap-4 sm:grid-cols-5">
        <div className="col-span-3 grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">Search in</Label>
            {filterData.search && (
              <button
                className="cursor-pointer"
                onClick={() => {
                  setFilterData((prev) => ({ ...prev, search: "" }));
                  refetchEvents();
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
                className="[grid-area:1/1] [&>input]:pr-9"
                value={filterData.search}
                onChange={(e) => {
                  setFilterData((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }));
                  if (e.target.value === "") {
                    refetchEvents();
                  }
                }}
              />
              <Button
                type="submit"
                variant="outline"
                size="icon"
                className="hover:text-foreground z-10 mr-1 size-8 self-center justify-self-end border-none !bg-transparent [grid-area:1/1] hover:bg-transparent"
              >
                <Search className="size-4" />
              </Button>
            </form>
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">Category</Label>
            {filterData.category && filterData.category !== "any" && (
              <button
                className="cursor-pointer"
                onClick={() => {
                  setFilterData((prev) => ({ ...prev, category: "any" }));
                }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Select
            value={filterData.category}
            onValueChange={(value) =>
              setFilterData((prev) => ({
                ...prev,
                category: value as EventCategory | "any",
              }))
            }
          >
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
        </div>
        <div className="grid gap-2">
          <Label htmlFor="event-location">Sort By</Label>
          <Select
            value={filterData.sort_by}
            onValueChange={(value) =>
              setFilterData((prev) => ({
                ...prev,
                sort_by: value as SortOptions,
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {SORT_OPTIONS.map((option, id) => (
                  <SelectItem key={id} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">From</Label>
            {filterData.start_date && !liveOnly && (
              <button
                className="cursor-pointer"
                onClick={() => {
                  setDateOpen((prev) => ({ ...prev, start: false }));
                  setFilterData((prev) => ({ ...prev, start_date: null }));
                }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Popover
            open={dateOpen.start}
            onOpenChange={(open) =>
              setDateOpen((prev) => ({ ...prev, start: open }))
            }
          >
            <PopoverTrigger
              asChild
              className="w-full overflow-hidden"
              disabled={liveOnly}
            >
              <Button
                variant="outline"
                data-empty={filterData.start_date === null}
                className="data-[empty=true]:text-muted-foreground justify-start text-left font-normal"
              >
                <CalendarIcon />
                {filterData.start_date ? (
                  format(filterData.start_date, "PP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filterData.start_date || undefined}
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    const formattedDate = set(selectedDate, {
                      hours: 0,
                      minutes: 0,
                      seconds: 0,
                    });

                    if (
                      filterData.end_date !== null &&
                      formattedDate <= filterData.end_date
                    ) {
                      setFilterData((prev) => ({
                        ...prev,
                        start_date: formattedDate,
                      }));
                    } else if (filterData.end_date === null) {
                      setFilterData((prev) => ({
                        ...prev,
                        start_date: formattedDate,
                      }));
                    } else {
                      toastError("Start date must be before end date");
                    }
                  }
                  setDateOpen((prev) => ({ ...prev, start: false }));
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">To</Label>
            {filterData.end_date && !liveOnly && (
              <button
                className="cursor-pointer"
                onClick={() => {
                  setDateOpen((prev) => ({ ...prev, end: false }));
                  setFilterData((prev) => ({ ...prev, end_date: null }));
                }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Popover
            open={dateOpen.end}
            onOpenChange={(open) =>
              setDateOpen((prev) => ({ ...prev, end: open }))
            }
          >
            <PopoverTrigger
              asChild
              className="w-full overflow-hidden"
              disabled={liveOnly}
            >
              <Button
                variant="outline"
                data-empty={!filterData.end_date}
                className="data-[empty=true]:text-muted-foreground justify-start text-left font-normal"
              >
                <CalendarIcon />
                {filterData.end_date ? (
                  format(filterData.end_date, "PP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filterData.end_date || undefined}
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    const formattedDate = set(selectedDate, {
                      hours: 23,
                      minutes: 59,
                      seconds: 59,
                    });
                    if (
                      filterData.start_date !== null &&
                      formattedDate >= filterData.start_date
                    ) {
                      setFilterData((prev) => ({
                        ...prev,
                        end_date: formattedDate,
                      }));
                    } else if (filterData.start_date === null) {
                      setFilterData((prev) => ({
                        ...prev,
                        end_date: formattedDate,
                      }));
                    } else {
                      toastError("End date must be after start date");
                    }
                  }
                  setDateOpen((prev) => ({ ...prev, end: false }));
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="mb-2.25 flex items-center gap-2">
          <Switch
            id="live-only"
            checked={liveOnly}
            onCheckedChange={handleSetLiveOnly}
          />
          <Label htmlFor="live-only">Live Only</Label>
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
