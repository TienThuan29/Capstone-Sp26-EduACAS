/**
 * Score color mapping utility.
 * Colors are defined in the frontend for better maintainability and theme flexibility.
 */

export const SCORE_COLORS: Record<string, string> = {
  "9-10": "#22C55E", // green
  "7-8": "#3B82F6",  // blue
  "5-6": "#FACC15",  // yellow
  "3-4": "#F97316",  // orange
  "0-2": "#EF4444",  // red
};

export const SCORE_COLOR_LIST = [
  SCORE_COLORS["9-10"],
  SCORE_COLORS["7-8"],
  SCORE_COLORS["5-6"],
  SCORE_COLORS["3-4"],
  SCORE_COLORS["0-2"],
];

export function getScoreColor(range: string): string {
  return SCORE_COLORS[range] ?? "#3B82F6"; // default blue
}

export function getScoreColorMap(): Record<string, string> {
  return { ...SCORE_COLORS };
}
