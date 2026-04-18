const VI_LOCALE = "vi-VN";
const VIETNAM_TZ = "Asia/Ho_Chi_Minh"; // UTC+7

/**
 * Converts a UTC ISO string to a YYYY-MM-DDTHH:mm string in Vietnam local time,
 * suitable for use in a datetime-local input.
 *
 * Uses Intl.DateTimeFormat with explicit timezone so the conversion is correct
 * regardless of the browser's own timezone setting.
 */
export function toLocalDatetimeString(
  isoString: string | null | undefined
): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";

    // Use Intl with explicit Vietnam timezone — correct even if browser is in a different timezone.
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: VIETNAM_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get(
      "minute"
    )}`;
  } catch {
    return "";
  }
}

/**
 * Converts a datetime-local YYYY-MM-DDTHH:mm value (which represents Vietnam local time —
 * the time the user selected in the input) to a UTC ISO string for sending to the API.
 *
 * The datetime-local input holds Vietnam local time; we convert it to UTC by subtracting
 * 7 hours. We do this using Intl to avoid browser-local-timezone bugs.
 */
export function toUtcIsoString(localString: string | null | undefined): string {
  if (!localString) return "";
  try {
    // Parse YYYY-MM-DDTHH:mm as Vietnam local time by using Intl to convert.
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: VIETNAM_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    // Build the datetime string as Vietnam local midnight for this date, then add
    // the user's selected hours/minutes by using a second parse with explicit fields.
    const [year, month, dayTime] = localString.split(/-/);
    const [day, time] = dayTime.split("T");
    const [hour, minute] = time.split(":");

    // Construct a date string in Vietnam timezone and parse it as UTC.
    // "2026-04-05T15:05:00.000Z" is the UTC equivalent of 2026-04-05T15:05 Vietnam (UTC+7).
    const vnHour = String(hour).padStart(2, "0");
    const vnMinute = String(minute).padStart(2, "0");
    const vnDateStr = `${year}-${month}-${day}T${vnHour}:${vnMinute}:00.000`;
    // Convert Vietnam local → UTC by using the formatter to get the UTC equivalent.
    const utcFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    // Parse the Vietnam-local datetime as a UTC instant: VN_local = UTC + 7h, so UTC = VN_local - 7h.
    // We achieve this by formatting the Vietnam datetime in UTC:
    // "2026-04-05T15:05" in Vietnam time → "2026-04-05T08:05" in UTC.
    // To get the UTC ISO string, we construct the Vietnam datetime and subtract 7 hours.
    const vnLocal = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0,
      0
    );
    // vnLocal is interpreted as local (browser) time by JavaScript, so subtract the
    // timezone offset explicitly. Then convert to ISO string.
    const browserOffsetMs = vnLocal.getTimezoneOffset() * 60 * 1000;
    const vnOffsetMs = 7 * 60 * 60 * 1000; // Vietnam is UTC+7
    // vnLocal_ms (as browser local) minus browser offset gives UTC,
    // then plus vn offset gives Vietnam local instant.
    // We want: UTC_instant = Vietnam_local_instant - 7h.
    // JavaScript's Date constructor with (y,m,d,h,min) treats h,min as LOCAL time.
    // So vnLocal represents browser-local time = UTC + browserOffset.
    // To get the correct UTC instant: vnLocal.getTime() - browserOffset - 7h_offset.
    const correctUtcMs = vnLocal.getTime() - browserOffsetMs - vnOffsetMs;
    return new Date(correctUtcMs).toISOString();
  } catch {
    return "";
  }
}

/**
 * Returns current time in Vietnam timezone as a YYYY-MM-DDTHH:mm string
 * for use as a default value in datetime-local inputs.
 * @param offsetMs Milliseconds to add to the current time (e.g. 3600000 for +1 hour).
 */
export function toLocalNowString(offsetMs = 0): string {
  return toLocalDatetimeString(new Date(Date.now() + offsetMs).toISOString());
}

/**
 * Format date with time (dd/mm/yyyy, hh:mm) in Vietnam timezone.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (value == null) return "";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    // Always format in Vietnam timezone so it matches what the user sees in the input.
    return d.toLocaleDateString(VI_LOCALE, {
      timeZone: VIETNAM_TZ,
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
 * Format date only (dd/mm/yyyy) in Vietnam timezone.
 */
export function formatDateOnly(value: string | Date | null | undefined): string {
  if (value == null) return "";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    return d.toLocaleDateString(VI_LOCALE, {
      timeZone: VIETNAM_TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

/**
 * Format time only (hh:mm) in Vietnam timezone.
 */
export function formatTime(value: string | Date | null | undefined): string {
  if (value == null) return "";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    return d.toLocaleTimeString(VI_LOCALE, {
      timeZone: VIETNAM_TZ,
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
