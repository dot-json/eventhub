import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ticketsApi } from "@/api/client";
import { createAppError, type AppError } from "@/utils/errorHandler";
import { useEventStore } from "./eventStore";

export interface TicketEventSummary {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  ticket_price: number;
  location: string;
}

export interface Ticket {
  id: number;
  event_id: number;
  user_id: number;
  hash: string;
  used_at: string | null;
  created_at: string;
  updated_at: string;
  event: TicketEventSummary;
}

// Return types for store functions
export type StoreResult<T> = (T & { message: string }) | { error: AppError };
export type StoreVoidResult = { message: string } | { error: AppError };

export interface GroupedTickets {
  used: Ticket[];
  unused: Ticket[];
  expired: Ticket[];
  upcoming: Ticket[];
  live: Ticket[];
}

// Helper functions for ticket categorization
const isTicketUsed = (ticket: Ticket): boolean => {
  return ticket.used_at !== null;
};

const isTicketExpired = (ticket: Ticket): boolean => {
  if (!ticket.event) return false;
  const now = new Date();
  const endDate = new Date(ticket.event.end_date);
  return endDate < now;
};

const isTicketUpcoming = (ticket: Ticket): boolean => {
  if (!ticket.event) return false;
  const now = new Date();
  const startDate = new Date(ticket.event.start_date);
  return startDate > now;
};

const isTicketLive = (ticket: Ticket): boolean => {
  if (!ticket.event) return false;
  const now = new Date();
  const startDate = new Date(ticket.event.start_date);
  const endDate = new Date(ticket.event.end_date);
  return startDate <= now && now <= endDate;
};

const getTicketCounts = (tickets: Ticket[]) => {
  const grouped = groupTicketsByStatus(tickets);
  return {
    used: grouped.used.length,
    unused: grouped.unused.length,
    expired: grouped.expired.length,
    upcoming: grouped.upcoming.length,
    live: grouped.live.length,
    total: tickets.length,
  };
};

// Export utility functions for external use
export { getTicketCounts };

const groupTicketsByStatus = (tickets: Ticket[]): GroupedTickets => {
  const used: Ticket[] = [];
  const unused: Ticket[] = [];
  const expired: Ticket[] = [];
  const upcoming: Ticket[] = [];
  const live: Ticket[] = [];

  tickets.forEach((ticket) => {
    if (isTicketUsed(ticket)) {
      used.push(ticket);
    } else if (isTicketExpired(ticket)) {
      expired.push(ticket);
    } else if (isTicketLive(ticket)) {
      live.push(ticket);
    } else if (isTicketUpcoming(ticket)) {
      upcoming.push(ticket);
    } else {
      // Default to unused if none of the above categories apply
      unused.push(ticket);
    }
  });

  // Sort each group by event start date (if event exists)
  const sortByEventDate = (a: Ticket, b: Ticket): number => {
    if (!a.event && !b.event) return 0;
    if (!a.event) return 1;
    if (!b.event) return -1;
    return (
      new Date(a.event.start_date).getTime() -
      new Date(b.event.start_date).getTime()
    );
  };

  used.sort(sortByEventDate);
  unused.sort(sortByEventDate);
  expired.sort(sortByEventDate);
  upcoming.sort(sortByEventDate);
  live.sort(sortByEventDate);

  return { used, unused, expired, upcoming, live };
};

interface TicketState {
  tickets: Ticket[];
  isLoading: boolean;
  error: AppError | null;

  // Actions
  fetchUserTicketsForEvent: (
    eventId: number,
  ) => Promise<StoreResult<{ tickets: Ticket[] }>>;
  fetchAllUserTickets: () => Promise<StoreResult<{ tickets: Ticket[] }>>;
  purchaseTickets: (
    eventId: number,
    quantity: number,
  ) => Promise<
    StoreResult<{ message: string; tickets: Ticket[]; count: number }>
  >;
  updateEventTicketCounts: (eventId: number, quantity: number) => void;
  clearError: () => void;
  clearTickets: () => void;

  // Computed getters
  getGroupedTickets: () => GroupedTickets;
  getTicketCounts: () => {
    used: number;
    unused: number;
    expired: number;
    upcoming: number;
    live: number;
    total: number;
  };
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      tickets: [],
      isLoading: false,
      error: null,

      // Computed getter
      getGroupedTickets: () => {
        return groupTicketsByStatus(get().tickets);
      },

      getTicketCounts: () => {
        return getTicketCounts(get().tickets);
      },

      fetchUserTicketsForEvent: async (eventId: number) => {
        try {
          set({ isLoading: true, error: null });

          const response = await ticketsApi.fetchUserTicketsForEvent(eventId);
          const tickets: Ticket[] = response.data.data;

          set({ tickets, isLoading: false });
          return { tickets, message: response.data.message };
        } catch (error) {
          const errorObj = createAppError(error);
          set({ isLoading: false, error: errorObj });

          return { error: errorObj };
        }
      },

      fetchAllUserTickets: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await ticketsApi.fetchAllUserTickets();
          const tickets: Ticket[] = response.data.data;

          set({ tickets, isLoading: false });
          return { tickets, message: response.data.message };
        } catch (error) {
          const errorObj = createAppError(error);
          set({ isLoading: false, error: errorObj });

          return { error: errorObj };
        }
      },

      purchaseTickets: async (eventId: number, quantity: number) => {
        try {
          const response = await ticketsApi.purchaseTickets(eventId, quantity);
          const created: Ticket[] = response.data.data;

          // Merge returned tickets into state
          set((state) => ({
            tickets: [...created, ...state.tickets],
            isPurchasing: false,
          }));

          get().updateEventTicketCounts(eventId, quantity);

          return {
            tickets: created,
            message: response.data.message,
            count: response.data.count,
          };
        } catch (error) {
          const errorObj = createAppError(error);
          set({ error: errorObj });

          return { error: errorObj };
        }
      },
      updateEventTicketCounts: (eventId: number, quantity: number) => {
        const eventStore = useEventStore.getState();

        // Only update currentEvent since tickets can only be purchased for it
        if (eventStore.currentEvent?.id === eventId) {
          eventStore.currentEvent = {
            ...eventStore.currentEvent,
            tickets_sold: eventStore.currentEvent.tickets_sold + quantity,
            user_ticket_count:
              (eventStore.currentEvent.user_ticket_count || 0) + quantity,
          };

          // Trigger re-render
          useEventStore.setState({
            currentEvent: eventStore.currentEvent,
          });
        }
      },

      clearError: () => set({ error: null }),
      clearTickets: () => set({ tickets: [] }),
    }),
    {
      name: "eventhub-ticket-store",
      partialize: (state) => ({ tickets: state.tickets }),
    },
  ),
);
