import { create } from "zustand";
import { persist } from "zustand/middleware";
import { eventsApi, api } from "@/api/client";
import { createAppError, type AppError } from "@/utils/errorHandler";

// Event types based on the backend schema
export type EventCategory =
  | "MUSIC"
  | "SPORTS"
  | "ART"
  | "CONFERENCE"
  | "WORKSHOP"
  | "SEMINAR"
  | "EXHIBITION"
  | "CHARITY"
  | "THEATRE"
  | "PARTY"
  | "FAIR"
  | "FASHION"
  | "COMEDY"
  | "FILM"
  | "CULINARY";

export const EVENT_CATEGORIES: Array<{ value: EventCategory; label: string }> =
  [
    { value: "MUSIC", label: "Music" },
    { value: "SPORTS", label: "Sports" },
    { value: "ART", label: "Art" },
    { value: "CONFERENCE", label: "Conference" },
    { value: "WORKSHOP", label: "Workshop" },
    { value: "SEMINAR", label: "Seminar" },
    { value: "EXHIBITION", label: "Exhibition" },
    { value: "CHARITY", label: "Charity" },
    { value: "THEATRE", label: "Theatre" },
    { value: "PARTY", label: "Party" },
    { value: "FAIR", label: "Fair" },
    { value: "FASHION", label: "Fashion" },
    { value: "COMEDY", label: "Comedy" },
    { value: "FILM", label: "Film" },
    { value: "CULINARY", label: "Culinary" },
  ];

export interface Event {
  id: number;
  title: string;
  description: string;
  category?: EventCategory;
  start_date: string;
  end_date: string;
  location: string;
  capacity: number;
  ticket_price: number;
  tickets_sold: number;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  organizer_id: number;
  created_at: string;
  updated_at: string;
  user_ticket_count?: number;
  organizer?: {
    id: number;
    first_name: string;
    last_name: string;
    org_name?: string;
  };
}

export interface CreateEventData {
  title: string;
  description: string;
  category?: EventCategory;
  start_date: string;
  end_date: string;
  location: string;
  capacity: number;
  ticket_price: number;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  status?: "DRAFT" | "PUBLISHED" | "CANCELLED";
}

export interface EventFilters {
  search?: string;
  category?: EventCategory;
  start_date?: string;
  end_date?: string;
  sort_by?: "date_asc" | "date_desc" | "ticket_price_asc" | "ticket_price_desc";
  limit?: number;
  offset?: number;
}

export interface GroupedEvents {
  live: Event[];
  upcoming: Event[];
  past: Event[];
  drafts: Event[];
}

// Helper functions for event categorization
const isEventLive = (event: Event): boolean => {
  const now = new Date();
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  return startDate <= now && now <= endDate && event.status === "PUBLISHED";
};

const isEventUpcoming = (event: Event): boolean => {
  const now = new Date();
  const startDate = new Date(event.start_date);
  return startDate > now && event.status === "PUBLISHED";
};

const isEventPast = (event: Event): boolean => {
  const now = new Date();
  const endDate = new Date(event.end_date);
  return endDate < now;
};

const getUserTicketCount = (event: Event): number => {
  return event.user_ticket_count || 0;
};

// Export utility functions for external use
export { getUserTicketCount };

const groupEventsByStatus = (events: Event[]): GroupedEvents => {
  const live: Event[] = [];
  const upcoming: Event[] = [];
  const past: Event[] = [];
  const drafts: Event[] = [];

  events.forEach((event) => {
    if (isEventLive(event)) {
      live.push(event);
    } else if (isEventUpcoming(event)) {
      upcoming.push(event);
    } else if (isEventPast(event)) {
      past.push(event);
    } else if (event.status === "DRAFT") {
      drafts.push(event);
    }
  });

  // Sort each group
  live.sort(
    (a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );
  upcoming.sort(
    (a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );
  past.sort(
    (a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime(),
  );

  return { live, upcoming, past, drafts };
};

// Return types for store functions
export type StoreResult<T> = (T & { message: string }) | { error: AppError };
export type StoreVoidResult = { message: string } | { error: AppError };

interface EventState {
  // State
  events: Event[];
  currentEvent: Event | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: AppError | null;

  // Actions
  fetchEvents: (filters?: EventFilters) => Promise<StoreVoidResult>;
  fetchEvent: (id: number) => Promise<StoreResult<Event>>;
  fetchMyEvents: () => Promise<StoreVoidResult>;
  createEvent: (
    eventData: CreateEventData,
  ) => Promise<StoreResult<{ event: Event }>>;
  updateEvent: (
    id: number,
    updates: UpdateEventData,
  ) => Promise<StoreResult<{ event: Event }>>;
  deleteEvent: (id: number) => Promise<StoreVoidResult>;
  clearError: () => void;
  clearCurrentEvent: () => void;

  // Computed getters
  getGroupedMyEvents: () => GroupedEvents;
  getUserTicketCount: (event: Event) => number;
}

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      // Initial state
      events: [],
      currentEvent: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,

      // Computed getter
      getGroupedMyEvents: () => {
        return groupEventsByStatus(get().events);
      },

      getUserTicketCount: (event: Event) => {
        return getUserTicketCount(event);
      },

      // Actions
      fetchEvents: async (filters?: EventFilters) => {
        try {
          set({ isLoading: true, error: null });

          // Build query parameters if filters are provided
          const queryParams = new URLSearchParams();
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              if (value) queryParams.append(key, value);
            });
          }

          const queryString = queryParams.toString();
          const url = queryString ? `/events?${queryString}` : "/events";

          // The API will automatically include user_ticket_count if user is authenticated
          // via JWT token in request headers
          const response = await api.get(url);
          const events = response.data.data;

          set({
            events,
            isLoading: false,
          });

          return { events, message: response.data.message };
        } catch (error) {
          const errorObj = createAppError(error);
          set({
            isLoading: false,
            error: errorObj,
          });
          return {
            error: errorObj,
          };
        }
      },

      fetchEvent: async (id: number) => {
        try {
          set({ isLoading: true, error: null });

          const response = await eventsApi.getEvent(id);
          const event = response.data.data;

          set({
            currentEvent: event,
            isLoading: false,
          });

          return event;
        } catch (error) {
          const errorObj = createAppError(error);
          set({
            isLoading: false,
            error: errorObj,
          });
          return {
            error: errorObj,
          };
        }
      },

      fetchMyEvents: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await eventsApi.getMyEvents();
          const events = response.data.data;

          set({
            events,
            isLoading: false,
          });

          return { events, message: response.data.message };
        } catch (error) {
          const errorObj = createAppError(error);
          set({
            isLoading: false,
            error: errorObj,
          });
          return {
            error: errorObj,
          };
        }
      },

      createEvent: async (eventData: CreateEventData) => {
        try {
          set({ isCreating: true, error: null });

          const response = await eventsApi.createEvent(eventData);
          const newEvent = response.data.data;

          // Add the new event to the events list
          set((state) => ({
            events: [newEvent, ...state.events],
            isCreating: false,
          }));

          return {
            event: newEvent,
            message: response.data.message,
          };
        } catch (error) {
          const errorObj = createAppError(error);
          set({
            isCreating: false,
            error: errorObj,
          });
          return {
            error: errorObj,
          };
        }
      },

      updateEvent: async (id: number, updates: UpdateEventData) => {
        try {
          set({ isUpdating: true, error: null });

          const response = await eventsApi.updateEvent(id, updates);
          const updatedEvent = response.data.data;

          // Update the event in the events array
          set((state) => ({
            events: state.events.map((event) =>
              event.id === id ? updatedEvent : event,
            ),
            currentEvent:
              state.currentEvent?.id === id ? updatedEvent : state.currentEvent,
            isUpdating: false,
          }));

          return {
            event: updatedEvent,
            message: response.data.message,
          };
        } catch (error) {
          const errorObj = createAppError(error);
          set({
            isUpdating: false,
            error: errorObj,
          });
          return {
            error: errorObj,
          };
        }
      },

      deleteEvent: async (id: number) => {
        try {
          set({ isDeleting: true, error: null });

          const response = await eventsApi.deleteEvent(id);

          // Remove the event from events array
          set((state) => ({
            events: state.events.filter((event) => event.id !== id),
            currentEvent:
              state.currentEvent?.id === id ? null : state.currentEvent,
            isDeleting: false,
          }));

          return { message: response.data.message };
        } catch (error) {
          const errorObj = createAppError(error);
          set({
            isDeleting: false,
            error: errorObj,
          });
          return {
            error: errorObj,
          };
        }
      },

      clearError: () => set({ error: null }),

      clearCurrentEvent: () => set({ currentEvent: null }),
    }),
    {
      name: "eventhub-event-store",
      // Only persist events data, not loading states or errors
      partialize: (state) => ({
        events: state.events,
      }),
    },
  ),
);
