import { EventMeetingKey, PaginatedResponse } from "../types/components.types";

// API Functions
export const fetchEventMeetingKeys = async (): Promise<EventMeetingKey[]> => {
  const response = await fetch("/api/event-meeting-key-list/");
  if (!response.ok) throw new Error("Failed to fetch event meeting keys");

  const data: PaginatedResponse<EventMeetingKey> = await response.json();
  return data.results; // Extract results from paginated response
};

export const createEventMeetingKeys = async (data: Partial<EventMeetingKey>[]): Promise<EventMeetingKey[]> => {
  const response = await fetch("/api/event-meeting-key-bulk-update/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create event meeting keys: ${response.status} ${errorText}`);
  }

  // Handle both paginated and non-paginated responses
  const result = await response.json();
  return Array.isArray(result) ? result : result.results || result;
};

export const updateEventMeetingKeys = async (data: EventMeetingKey[]): Promise<EventMeetingKey[]> => {
  const response = await fetch("/api/event-meeting-key-bulk-update/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update event meeting keys: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return Array.isArray(result) ? result : result.results || result;
};

export const deleteEventMeetingKey = async (id: number): Promise<void> => {
  const url = `/api/event-meeting-key-list/${String(id).trim()}`;
  console.log("DELETE URL:", url);

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Delete error:", response.status, errorText);
    throw new Error(`Failed to delete event meeting key: ${response.status} ${errorText}`);
  }

  // DELETE typically returns 204 No Content
  return;
};
