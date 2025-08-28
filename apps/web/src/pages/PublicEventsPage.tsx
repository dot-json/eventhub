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
import { EVENT_CATEGORIES, useEventStore } from "@/stores/eventStore";
import { toastError } from "@/utils/toastWrapper";
import { format } from "date-fns";
import { CalendarIcon, Search, SearchX, X } from "lucide-react";
import { useState, useEffect } from "react";
import { PublicEvent } from "@/components/events";
import { Switch } from "@/components/ui/switch";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useSearchParams, useNavigate, useLocation } from "react-router";
import { cn } from "@/lib/utils";

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

const PublicEventsPage = () => {
  const {
    events,
    fetchEvents,
    pagination,
    getNextPage,
    getPrevPage,
    hasNextPage,
    hasPrevPage,
    isLoading,
    error,
  } = useEventStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [liveOnly, setLiveOnly] = useState(false);

  const buildQuery = () => {
    const params = new URLSearchParams();

    if (search) params.set("search", search);

    const category = searchParams.get("category");
    if (category && category !== "any") params.set("category", category);

    const startDate = searchParams.get("start_date");
    if (startDate) params.set("start_date", startDate);

    const endDate = searchParams.get("end_date");
    if (endDate) params.set("end_date", endDate);

    const sortBy = searchParams.get("sort_by") || "date_asc";
    params.set("sort_by", sortBy);

    const page = searchParams.get("page") || "1";
    params.set("page", page);

    params.set("limit", "5");

    return params.toString();
  };

  const updateFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== "any") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.set("page", "1");
    params.set("limit", "5");
    if (!params.get("sort_by")) params.set("sort_by", "date_asc");

    navigate(`/events?${params.toString()}`, { replace: true });
  };

  useEffect(() => {
    setSearch(searchParams.get("search") || "");

    if (searchParams.toString() === "") {
      navigate("/events?sort_by=date_asc&page=1&limit=5", { replace: true });
      return;
    }

    const query = buildQuery();
    fetchEvents(query);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    navigate(`/events?${params.toString()}`, { replace: true });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);

    if (value === "") {
      const params = new URLSearchParams(searchParams);
      params.delete("search");
      params.set("page", "1");
      navigate(`/events?${params.toString()}`, { replace: true });
    }
  };

  const handleLiveOnly = (value: boolean) => {
    setLiveOnly(value);

    if (value) {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).toISOString();
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
      ).toISOString();
      updateFilters({
        start_date: startOfDay,
        end_date: endOfDay,
      });
    } else {
      updateFilters({
        start_date: "",
        end_date: "",
      });
    }
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    navigate(`/events?${params.toString()}`, { replace: true });
  };

  const handleNextPage = () => {
    const nextPage = getNextPage();
    if (nextPage) handlePageChange(nextPage);
  };

  const handlePrevPage = () => {
    const prevPage = getPrevPage();
    if (prevPage) handlePageChange(prevPage);
  };

  const [dateOpen, setDateOpen] = useState<{ start: boolean; end: boolean }>({
    start: false,
    end: false,
  });

  return (
    <div className="flex h-full flex-1 flex-col gap-4 sm:gap-6">
      <h1>Public Events</h1>
      <div className="grid grid-cols-4 grid-rows-2 items-end gap-4 sm:grid-cols-5">
        <div className="col-span-4 grid gap-2 sm:col-span-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">Search in</Label>
            <button
              className={cn(
                "pointer-events-none cursor-pointer opacity-0 transition-opacity",
                search && "pointer-events-auto opacity-100",
              )}
              onClick={() => handleSearchChange("")}
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="grid">
            <form onSubmit={handleSearchSubmit} className="grid">
              <Input
                placeholder="Names, descriptions, locations..."
                className="[grid-area:1/1] [&>input]:pr-9"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
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

        <div className="col-span-2 grid gap-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">Category</Label>
            <button
              className={cn(
                "pointer-events-none cursor-pointer opacity-0 transition-opacity",
                searchParams.get("category") &&
                  searchParams.get("category") !== "any" &&
                  "pointer-events-auto opacity-100",
              )}
              onClick={() => updateFilters({ category: "" })}
            >
              <X className="size-3.5" />
            </button>
          </div>
          <Select
            value={searchParams.get("category") || "any"}
            onValueChange={(value) => updateFilters({ category: value })}
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

        <div className="col-span-2 grid gap-2 sm:col-span-1">
          <Label htmlFor="event-location">Sort By</Label>
          <Select
            value={searchParams.get("sort_by") || "date_asc"}
            onValueChange={(value) => updateFilters({ sort_by: value })}
          >
            <SelectTrigger className="w-full overflow-hidden">
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

        <div className="col-span-2 grid gap-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">From</Label>
            <button
              className={cn(
                "pointer-events-none cursor-pointer opacity-0 transition-opacity",
                searchParams.get("start_date") &&
                  !liveOnly &&
                  "pointer-events-auto opacity-100",
              )}
              onClick={() => {
                setDateOpen((prev) => ({ ...prev, start: false }));
                updateFilters({ start_date: "" });
              }}
            >
              <X className="size-3.5" />
            </button>
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
                data-empty={!searchParams.get("start_date")}
                className="data-[empty=true]:text-muted-foreground justify-start text-left font-normal"
              >
                <CalendarIcon />
                {searchParams.get("start_date") ? (
                  format(new Date(searchParams.get("start_date")!), "PP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  searchParams.get("start_date")
                    ? new Date(searchParams.get("start_date")!)
                    : undefined
                }
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    const startOfDay = new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth(),
                      selectedDate.getDate(),
                    ).toISOString();
                    const endDate = searchParams.get("end_date");

                    if (endDate && selectedDate <= new Date(endDate)) {
                      updateFilters({ start_date: startOfDay });
                    } else if (!endDate) {
                      updateFilters({ start_date: startOfDay });
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

        <div className="col-span-2 grid gap-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">To</Label>
            <button
              className={cn(
                "pointer-events-none cursor-pointer opacity-0 transition-opacity",
                searchParams.get("end_date") &&
                  !liveOnly &&
                  "pointer-events-auto opacity-100",
              )}
              onClick={() => {
                setDateOpen((prev) => ({ ...prev, end: false }));
                updateFilters({ end_date: "" });
              }}
            >
              <X className="size-3.5" />
            </button>
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
                data-empty={!searchParams.get("end_date")}
                className="data-[empty=true]:text-muted-foreground justify-start text-left font-normal"
              >
                <CalendarIcon />
                {searchParams.get("end_date") ? (
                  format(new Date(searchParams.get("end_date")!), "PP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  searchParams.get("end_date")
                    ? new Date(searchParams.get("end_date")!)
                    : undefined
                }
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    const endOfDay = new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth(),
                      selectedDate.getDate(),
                      23,
                      59,
                      59,
                    ).toISOString();
                    const startDate = searchParams.get("start_date");

                    if (startDate && selectedDate >= new Date(startDate)) {
                      updateFilters({ end_date: endOfDay });
                    } else if (!startDate) {
                      updateFilters({ end_date: endOfDay });
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

        <div className="my-1 flex items-center gap-2 sm:mb-2.25">
          <Switch
            id="live-only"
            checked={liveOnly}
            onCheckedChange={handleLiveOnly}
          />
          <Label htmlFor="live-only">Live Only</Label>
        </div>
      </div>

      <section className="flex h-full flex-1 flex-col gap-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading events...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-destructive">
              Error loading events: {error.message}
            </div>
          </div>
        ) : (
          <>
            {events.map((event) => (
              <PublicEvent
                key={event.id}
                {...event}
                fromLink={location.pathname + location.search}
              />
            ))}
            {events.length === 0 && (
              <p className="text-muted-foreground my-16 flex w-full items-center justify-center gap-2 text-center">
                <SearchX />
                No events found
              </p>
            )}
          </>
        )}

        {!isLoading && !error && pagination && pagination.totalPages > 1 && (
          <Pagination className="mt-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={hasPrevPage() ? handlePrevPage : undefined}
                  className={
                    !hasPrevPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.totalPages) return null;

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNum)}
                        isActive={pageNum === pagination.page}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                },
              )}

              {pagination.page < pagination.totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={hasNextPage() ? handleNextPage : undefined}
                  className={
                    !hasNextPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </section>
    </div>
  );
};

export default PublicEventsPage;
