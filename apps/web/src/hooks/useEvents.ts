import { useEventStore } from "../stores/eventStore";

export const useEvents = () => {
  const {
    events,
    currentEvent,
    getGroupedMyEvents,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
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
    isCreating,
    isUpdating,
    isDeleting,
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
    isAnyLoading: isLoading || isCreating || isUpdating || isDeleting,

    // Individual groups for convenience
    liveMyEvents: groupedMyEvents.live,
    upcomingMyEvents: groupedMyEvents.upcoming,
    pastMyEvents: groupedMyEvents.past,
  };
};
