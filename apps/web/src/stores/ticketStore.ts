import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ticketsApi } from "@/api/client";
import { createAppError, type AppError } from "@/utils/errorHandler";

export interface TicketEventSummary {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
}

export interface Ticket {
  id: number;
  event_id: number;
  user_id: number;
  hash: string;
  is_used: boolean;
  created_at: string;
  updated_at: string;
  event?: TicketEventSummary;
}

// Return types for store functions
export type StoreResult<T> = (T & { message: string }) | { error: AppError };
export type StoreVoidResult = { message: string } | { error: AppError };

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
  clearError: () => void;
  clearTickets: () => void;
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, _get) => ({
      tickets: [],
      isLoading: false,
      error: null,

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

      clearError: () => set({ error: null }),
      clearTickets: () => set({ tickets: [] }),
    }),
    {
      name: "eventhub-ticket-store",
      partialize: (state) => ({ tickets: state.tickets }),
    },
  ),
);
