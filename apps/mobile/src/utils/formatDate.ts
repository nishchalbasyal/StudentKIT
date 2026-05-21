export function formatDate(value?: string | null) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en-DE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatShortDate(value?: string | null) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en-DE", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

/**
 * Format date for display in UI: "20 May 2026"
 */
export function formatDisplayDate(value?: string | null) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

/**
 * Format datetime for display: "20 May 2026 · 07:00"
 */
export function formatDisplayDateTime(value?: string | null) {
  if (!value) return "No date";

  const date = new Date(value);
  const dateStr = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const timeStr = new Intl.DateTimeFormat("en-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${dateStr} · ${timeStr}`;
}

/**
 * Format date relative to today: "Today · 07:00" or "20 May · 07:00"
 */
export function formatRelativeDueDate(value?: string | null) {
  if (!value) return "No date";

  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateStr = date.toDateString();
  const todayStr = today.toDateString();
  const tomorrowStr = tomorrow.toDateString();

  let prefix = "";
  if (dateStr === todayStr) {
    prefix = "Today";
  } else if (dateStr === tomorrowStr) {
    prefix = "Tomorrow";
  } else {
    prefix = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    }).format(date);
  }

  const timeStr = new Intl.DateTimeFormat("en-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${prefix} · ${timeStr}`;
}

export function getCurrentMonthParams() {
  const now = new Date();

  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}
