import { useEventStore } from "../stores/eventStore";

export const useEvents = () => {
  const {
    events,
    currentEvent,
    getGroupedMyEvents,
    isLoading,
    error,
    fetchEvents,
    fetchEvent,
    fetchMyEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    clearError,
    clearCurrentEvent,
  } = useEventStore();

  const groupedMyEvents = getGroupedMyEvents();

  return {
    // State
    events,
    currentEvent,
    groupedMyEvents,
    isLoading,
    error,

    // Actions
    fetchEvents,
    fetchEvent,
    fetchMyEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    clearError,
    clearCurrentEvent,

    // Computed values
    hasEvents: events.length > 0,

    // Individual groups for convenience
    liveMyEvents: groupedMyEvents.live,
    upcomingMyEvents: groupedMyEvents.upcoming,
    pastMyEvents: groupedMyEvents.past,
  };
};
