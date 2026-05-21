import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/httpError.js";

function mapEvent(event: any) {
  return {
    ...event,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
  };
}

export async function listEvents() {
  const events = await prisma.event.findMany({
    where: { isActive: true },
    orderBy: { startsAt: "asc" },
  });

  return events.map(mapEvent);
}

export async function getEvent(id: string) {
  const event = await prisma.event.findFirst({ where: { id, isActive: true } });
  if (!event) throw new HttpError(404, "NOT_FOUND", "Event not found");
  return mapEvent(event);
}
