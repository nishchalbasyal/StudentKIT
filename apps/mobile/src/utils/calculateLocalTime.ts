export function toLocalTimeLabel(value?: string | null) {
  if (!value) return "";

  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-DE", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

