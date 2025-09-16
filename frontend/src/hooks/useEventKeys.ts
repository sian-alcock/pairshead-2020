import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EventMeetingKey } from "../types/components.types";
import {
  createEventMeetingKeys,
  deleteEventMeetingKey,
  fetchEventMeetingKeys,
  updateEventMeetingKeys
} from "../api/eventKeys";

export const useEventMeetingKeys = () => {
  return useQuery<EventMeetingKey[]>({
    queryKey: ["eventMeetingKeys"],
    queryFn: fetchEventMeetingKeys,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

export const useCreateEventMeetingKeys = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEventMeetingKeys,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventMeetingKeys"] });
      queryClient.invalidateQueries({ queryKey: ["eventKeys"] });
    },
    onError: (error) => {
      console.error("Create event meeting keys failed:", error);
    }
  });
};

export const useUpdateEventMeetingKeys = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEventMeetingKeys,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventMeetingKeys"] });
      queryClient.invalidateQueries({ queryKey: ["eventKeys"] });
    },
    onError: (error) => {
      console.error("Update event meeting keys failed:", error);
    }
  });
};

export const useDeleteEventMeetingKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEventMeetingKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventMeetingKeys"] });
      queryClient.invalidateQueries({ queryKey: ["eventKeys"] });
    },
    onError: (error) => {
      console.error("Delete event meeting key failed:", error);
    }
  });
};

// Composite hook for easier state management
export const useEventMeetingKeyManager = () => {
  const query = useEventMeetingKeys();
  const createMutation = useCreateEventMeetingKeys();
  const updateMutation = useUpdateEventMeetingKeys();
  const deleteMutation = useDeleteEventMeetingKey();

  const saveNewItems = (newItems: EventMeetingKey[]) => {
    const validNewItems = newItems.filter((item) => item.event_meeting_key && item.event_meeting_name);
    if (validNewItems.length > 0) {
      return createMutation.mutateAsync(validNewItems);
    }
    return Promise.resolve([]);
  };

  const saveExistingItems = (existingItems: EventMeetingKey[]) => {
    const itemsWithIds = existingItems.filter((item) => item.id);
    if (itemsWithIds.length > 0) {
      return updateMutation.mutateAsync(itemsWithIds);
    }
    return Promise.resolve([]);
  };

  const deleteItem = (id: number) => {
    return deleteMutation.mutateAsync(id);
  };

  const isLoading = query.isLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const error = query.error || createMutation.error || updateMutation.error || deleteMutation.error;

  return {
    data: query.data || [],
    isLoading,
    isSaving,
    isDeleting,
    error,
    saveNewItems,
    saveExistingItems,
    deleteItem,
    refetch: query.refetch
  };
};
