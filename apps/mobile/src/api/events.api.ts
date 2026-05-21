import { apiClient, unwrap } from "./apiClient";
import type { Event } from "../types/content.types";

export async function getEventsApi() {
  return unwrap<Event[]>(await apiClient.get("/events"));
}

export async function getEventApi(id: string) {
  return unwrap<Event>(await apiClient.get(`/events/${id}`));
}
