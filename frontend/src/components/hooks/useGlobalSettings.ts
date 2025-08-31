import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface GlobalSettings {
  id: number;
  broe_data_last_update: string | null;
  race_mode: 'SETUP' | 'PRE_RACE' | 'RACE';
}

interface EventKey {
  id: number;
  event_meeting_name: string;
  current_event_meeting: boolean;
}

const fetchGlobalSettings = async (): Promise<GlobalSettings[]> => {
  const response = await fetch(`api/global-settings-list/`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch global settings: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  return data;
};

const fetchEventKeys = async (): Promise<EventKey[]> => {
  const response = await fetch(`api/event-meeting-key-list/`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch event keys: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  return data;
};

const updateGlobalSettings = async ({ 
  id, 
  data 
}: { 
  id: number; 
  data: Partial<GlobalSettings> 
}): Promise<GlobalSettings> => {
  const response = await fetch(`api/global-settings-list/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update global settings: ${response.status} ${errorText}`);
  }
  
  const result = await response.json();
  return result;
};

export const useGlobalSettings = () => {
  return useQuery({
    queryKey: ['globalSettings'],
    queryFn: fetchGlobalSettings,
  });
};

export const useEventKeys = () => {
  return useQuery({
    queryKey: ['eventKeys'],
    queryFn: fetchEventKeys,
  });
};

export const useUpdateGlobalSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateGlobalSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalSettings'] });
    },
  });
};

export const useRaceMode = () => {
  const { data: settings, isLoading, error } = useGlobalSettings();
  const updateMutation = useUpdateGlobalSettings();
  
  const currentSettings = settings?.[0];
  
  const updateRaceMode = (newMode: 'SETUP' | 'PRE_RACE' | 'RACE') => {
    if (currentSettings) {
      updateMutation.mutate({
        id: currentSettings.id,
        data: { race_mode: newMode }
      });
    }
  };
  
  return {
    raceMode: currentSettings?.race_mode,
    updateRaceMode,
    isLoading: isLoading || updateMutation.isPending,
    error: error || updateMutation.error,
    isUpdating: updateMutation.isPending,
  };
};

// Usage:   const { raceMode } = useCurrentRaceMode();

export const useCurrentRaceMode = () => {
  const { data: settings, isLoading } = useGlobalSettings();
  const currentSettings = settings?.[0];
  
  return {
    raceMode: currentSettings?.race_mode,
    isLoading,
  };
};

export const useCurrentEvent = () => {
  const { data: eventKeys, isLoading } = useEventKeys();
  
  const getCurrentEventName = (): string | undefined => {
    if (eventKeys) {
      const currentEvent = eventKeys.find(key => key.current_event_meeting);
      return currentEvent?.event_meeting_name;
    }
    return undefined;
  };
  
  return {
    currentEventName: getCurrentEventName(),
    isLoading,
  };
};