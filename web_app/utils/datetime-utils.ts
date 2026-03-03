const VI_LOCALE = "vi-VN";

/**
 * Format date with time (dd/mm/yyyy, hh:mm) in vi-VN locale.
 * Use for timestamps (e.g. created date, exam start/end).
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (value == null) return "";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    return d.toLocaleDateString(VI_LOCALE, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

/**
 * Format date only (dd/mm/yyyy) in vi-VN locale.
 * Use when time is not needed (e.g. birthday, range labels).
 */
export function formatDateOnly(value: string | Date | null | undefined): string {
  if (value == null) return "";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    return d.toLocaleDateString(VI_LOCALE, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

/**
 * Format time only (hh:mm) in vi-VN locale.
 */
export function formatTime(value: string | Date | null | undefined): string {
  if (value == null) return "";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    return d.toLocaleTimeString(VI_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

export function formatDurationMs(ms: number): string {
  const totalMinutes = Math.round(ms / (1000 * 60));
  if (totalMinutes < 60) return `${totalMinutes} minutes`;

  const totalHours = totalMinutes / 60;
  const hours = Math.floor(totalHours);
  const minutes = totalMinutes % 60;

  if (hours < 24) {
    if (minutes === 0) return `${hours} hours`;
    return `${hours} hours ${minutes} minutes`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} days`);
  if (remainingHours > 0) parts.push(`${remainingHours} hours`);
  if (minutes > 0) parts.push(`${minutes} minutes`);
  return parts.join(" ");
}
