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
