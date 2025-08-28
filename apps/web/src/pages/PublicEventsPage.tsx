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
import { useSearchParams } from "react-router";

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
  start_date: string | null;
  end_date: string | null;
  sort_by: SortOptions;
  page: number;
  limit: number;
}

const PublicEventsPage = () => {
  const {
    events,
    fetchEvents,
    pagination,
    getNextPage,
    getPrevPage,
    hasNextPage,
    hasPrevPage,
  } = useEventStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [queryData, setQueryData] = useState<QueryFormData>({
    search: "",
    category: "any",
    start_date: null,
    end_date: null,
    sort_by: "date_asc",
    page: 1,
    limit: 5,
  });

  const updateFilters = (newFilters: Partial<QueryFormData>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, value]) => {
      // keep numbers and booleans; only drop undefined, null, empty-string, or "any"
      if (
        value !== undefined &&
        value !== null &&
        value !== "any" &&
        value !== ""
      ) {
        // For dates, serialize to YYYY-MM-DD for cleaner URLs
        if (
          (key === "start_date" || key === "end_date") &&
          typeof value === "string"
        ) {
          try {
            const d = new Date(value);
            const short = format(d, "yyyy-MM-dd");
            params.set(key, short);
          } catch (err) {
            params.set(key, String(value));
          }
        } else {
          params.set(key, String(value));
        }
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  };

  const [isInitialized, setIsInitialized] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    // update local state and sync to URL; the effect watching `searchParams` will
    // trigger the actual fetch so we avoid duplicate requests and races.
    setQueryData((prev) => ({ ...prev, page }));
    updateFilters({ page });
  };

  const handleNextPage = () => {
    const nextPage = getNextPage();
    if (nextPage) {
      handlePageChange(nextPage);
    }
  };

  const handlePrevPage = () => {
    const prevPage = getPrevPage();
    if (prevPage) {
      handlePageChange(prevPage);
    }
  };

  // Initialize from URL params on first load
  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page") || "1");
    const urlSearch = searchParams.get("search") || "";
    const urlCategory =
      (searchParams.get("category") as EventCategory) || "any";
    const urlSortBy =
      (searchParams.get("sort_by") as SortOptions) || "date_asc";

    // Dates in URL are YYYY-MM-DD; convert to ISO strings for internal use
    const urlStartDate = searchParams.get("start_date")
      ? new Date(`${searchParams.get("start_date")}T00:00:00Z`).toISOString()
      : null;
    const urlEndDate = searchParams.get("end_date")
      ? new Date(`${searchParams.get("end_date")}T23:59:59Z`).toISOString()
      : null;

    setQueryData({
      search: urlSearch,
      category: urlCategory,
      start_date: urlStartDate,
      end_date: urlEndDate,
      sort_by: urlSortBy,
      page: urlPage,
      limit: 5,
    });

    setIsInitialized(true);
  }, []); // Only run once on mount

  const handleSetLiveOnly = (value: boolean) => {
    // if true set the date range and make them disabled
    if (value) {
      setQueryData((prev) => ({
        ...prev,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
      }));
    } else {
      setQueryData((prev) => ({
        ...prev,
        start_date: null,
        end_date: null,
      }));
    }

    setLiveOnly(value);
  };

  useEffect(() => {
    if (!isInitialized) return; // Skip on initial load

    updateFilters(queryData);
  }, [
    queryData.category,
    queryData.start_date,
    queryData.end_date,
    queryData.page,
    queryData.sort_by,
    isInitialized,
  ]);

  useEffect(() => {
    if (!isInitialized) return; // Skip on initial load

    // Trigger store fetch with the serialized search params so pagination is applied
    fetchEvents(searchParams.toString());
  }, [searchParams.toString(), isInitialized]);

  const [dateOpen, setDateOpen] = useState<{ start: boolean; end: boolean }>({
    start: false,
    end: false,
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <h1>Public Events</h1>
      <div className="grid grid-cols-4 grid-rows-2 items-end gap-4 sm:grid-cols-5">
        <div className="col-span-4 grid gap-2 sm:col-span-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">Search in</Label>
            {queryData.search && (
              <button
                className="cursor-pointer"
                onClick={() => {
                  setQueryData((prev) => ({ ...prev, search: "", page: 1 }));
                  updateFilters({ search: "", page: 1 });
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
                // reset to first page when submitting a new search
                setQueryData((prev) => ({ ...prev, page: 1 }));
                updateFilters({ search: queryData.search, page: 1 });
              }}
              className="grid"
            >
              <Input
                placeholder="Names, descriptions, locations..."
                className="[grid-area:1/1] [&>input]:pr-9"
                value={queryData.search}
                onChange={(e) => {
                  const value = e.target.value;
                  setQueryData((prev) => ({ ...prev, search: value }));
                  if (value === "") {
                    // clear search and reset to first page
                    setQueryData((prev) => ({ ...prev, page: 1 }));
                    updateFilters({ search: "", page: 1 });
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
        <div className="col-span-2 grid gap-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">Category</Label>
            {queryData.category && queryData.category !== "any" && (
              <button
                className="cursor-pointer"
                onClick={() => {
                  setQueryData((prev) => ({ ...prev, category: "any" }));
                }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Select
            value={queryData.category}
            onValueChange={(value) =>
              // reset to first page when changing category
              setQueryData((prev) => ({
                ...prev,
                category: value as EventCategory | "any",
                page: 1,
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
        <div className="col-span-2 grid gap-2 sm:col-span-1">
          <Label htmlFor="event-location">Sort By</Label>
          <Select
            value={queryData.sort_by}
            onValueChange={(value) =>
              // reset to first page on sort change
              setQueryData((prev) => ({
                ...prev,
                sort_by: value as SortOptions,
                page: 1,
              }))
            }
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
            {queryData.start_date && !liveOnly && (
              <button
                className="cursor-pointer"
                onClick={() => {
                  setDateOpen((prev) => ({ ...prev, start: false }));
                  setQueryData((prev) => ({ ...prev, start_date: null }));
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
                data-empty={queryData.start_date === null}
                className="data-[empty=true]:text-muted-foreground justify-start text-left font-normal"
              >
                <CalendarIcon />
                {queryData.start_date ? (
                  format(new Date(queryData.start_date), "PP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  queryData.start_date !== null
                    ? new Date(queryData.start_date)
                    : undefined
                }
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    const formattedDate = set(selectedDate, {
                      hours: 0,
                      minutes: 0,
                      seconds: 0,
                    });

                    if (
                      queryData.end_date !== null &&
                      formattedDate <= new Date(queryData.end_date)
                    ) {
                      setQueryData((prev) => ({
                        ...prev,
                        start_date: formattedDate.toISOString(),
                        page: 1,
                      }));
                    } else if (queryData.end_date === null) {
                      setQueryData((prev) => ({
                        ...prev,
                        start_date: formattedDate.toISOString(),
                        page: 1,
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
        <div className="col-span-2 grid gap-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-location">To</Label>
            {queryData.end_date && !liveOnly && (
              <button
                className="cursor-pointer"
                onClick={() => {
                  setDateOpen((prev) => ({ ...prev, end: false }));
                  setQueryData((prev) => ({ ...prev, end_date: null }));
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
                data-empty={!queryData.end_date}
                className="data-[empty=true]:text-muted-foreground justify-start text-left font-normal"
              >
                <CalendarIcon />
                {queryData.end_date ? (
                  format(new Date(queryData.end_date), "PP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  queryData.end_date !== null
                    ? new Date(queryData.end_date)
                    : undefined
                }
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    const formattedDate = set(selectedDate, {
                      hours: 23,
                      minutes: 59,
                      seconds: 59,
                    });
                    if (
                      queryData.start_date !== null &&
                      formattedDate >= new Date(queryData.start_date)
                    ) {
                      setQueryData((prev) => ({
                        ...prev,
                        end_date: formattedDate.toISOString(),
                        page: 1,
                      }));
                    } else if (queryData.start_date === null) {
                      setQueryData((prev) => ({
                        ...prev,
                        end_date: formattedDate.toISOString(),
                        page: 1,
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
        <div className="my-1 flex items-center gap-2 sm:mb-2.25">
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
        {events.length === 0 && (
          <p className="text-muted-foreground my-16 flex w-full items-center justify-center gap-2 text-center">
            <SearchX />
            No events found
          </p>
        )}
        {pagination && pagination.totalPages > 1 && (
          <Pagination>
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

              {/* Generate page numbers */}
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
