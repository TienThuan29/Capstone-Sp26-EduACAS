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

/**
 * Format a nullable/optional date for display (e.g. graded date).
 * Returns placeholder "—" when value is null, empty, invalid, or a sentinel/min date (year < 1900).
 * Backend may send default/min date (e.g. 0001-01-01) instead of null for unset dates.
 */
export function formatGradedDate(
  value: string | Date | null | undefined,
  placeholder = "—"
): string {
  if (value == null || (typeof value === "string" && value === ""))
    return placeholder;
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(d.getTime()) || d.getFullYear() < 1900) return placeholder;
    return formatDate(value);
  } catch {
    return placeholder;
  }
}

/**
 * Converts UTC ISO string to local 'YYYY-MM-DDTHH:mm' for datetime-local input.
 */
export function toLocalDatetimeString(
  isoString: string | null | undefined
): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";

    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

/**
 * Converts local 'YYYY-MM-DDTHH:mm' from datetime-local input to UTC ISO string.
 */
export function toUtcIsoString(localString: string | null | undefined): string {
  if (!localString) return "";
  try {
    const d = new Date(localString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  } catch {
    return "";
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
