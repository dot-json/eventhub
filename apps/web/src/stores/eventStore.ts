import { create } from "zustand";
import { persist } from "zustand/middleware";
import { eventsApi, api } from "@/api/client";
import { extractErrorMessage } from "@/utils/errorHandler";

// Event types based on the backend schema
export interface Event {
  id: number;
  title: string;
  description: string;
  category?: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  location: string;
  capacity: number;
  ticket_price: number;
  tickets_remaining: number;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  organizer_id: number;
  created_at: string;
  updated_at: string;
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
  category?: string;
  startDate: Date | string;
  endDate: Date | string;
  location: string;
  capacity: number;
  ticket_price: number;
}

export interface UpdateEventData extends Partial<CreateEventData> {}

export interface EventFilters {
  category?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface GroupedEvents {
  live: Event[];
  upcoming: Event[];
  past: Event[];
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

const groupEventsByStatus = (events: Event[]): GroupedEvents => {
  const live: Event[] = [];
  const upcoming: Event[] = [];
  const past: Event[] = [];

  events.forEach((event) => {
    if (isEventLive(event)) {
      live.push(event);
    } else if (isEventUpcoming(event)) {
      upcoming.push(event);
    } else if (isEventPast(event)) {
      past.push(event);
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
  ); // Most recent first

  return { live, upcoming, past };
};

interface EventState {
  // State
  events: Event[];
  currentEvent: Event | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Actions
  fetchEvents: (filters?: EventFilters) => Promise<void>;
  fetchEvent: (id: number) => Promise<Event | null>;
  fetchMyEvents: () => Promise<void>;
  createEvent: (eventData: CreateEventData) => Promise<Event | null>;
  updateEvent: (id: number, updates: UpdateEventData) => Promise<Event | null>;
  deleteEvent: (id: number) => Promise<boolean>;
  clearError: () => void;
  clearCurrentEvent: () => void;

  // Computed getters
  getGroupedMyEvents: () => GroupedEvents;
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

          const response = await api.get(url);
          const events = response.data.data;

          set({
            events,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: extractErrorMessage(error),
          });
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
          set({
            isLoading: false,
            error: extractErrorMessage(error),
          });
          return null;
        }
      },

      fetchMyEvents: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await api.get("/events/my-events");
          const events = response.data.data;

          set({
            events,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: extractErrorMessage(error),
          });
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

          return newEvent;
        } catch (error) {
          set({
            isCreating: false,
            error: extractErrorMessage(error),
          });
          return null;
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

          return updatedEvent;
        } catch (error) {
          set({
            isUpdating: false,
            error: extractErrorMessage(error),
          });
          return null;
        }
      },

      deleteEvent: async (id: number) => {
        try {
          set({ isDeleting: true, error: null });

          await eventsApi.deleteEvent(id);

          // Remove the event from events array
          set((state) => ({
            events: state.events.filter((event) => event.id !== id),
            currentEvent:
              state.currentEvent?.id === id ? null : state.currentEvent,
            isDeleting: false,
          }));

          return true;
        } catch (error) {
          set({
            isDeleting: false,
            error: extractErrorMessage(error),
          });
          return false;
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
