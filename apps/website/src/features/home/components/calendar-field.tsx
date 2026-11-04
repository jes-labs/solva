const WEEKS = 52;
const DAYS = 7;
const MISSED = new Set([3 * 7 + 2, 11 * 7 + 5, 19 * 7 + 1, 33 * 7 + 4, 40 * 7 + 6]);

export const calendarTotals = {
  days: WEEKS * DAYS,
  missed: MISSED.size,
  proofs: WEEKS * DAYS - MISSED.size,
} as const;

export function CalendarField() {
  const cells: { x: number; y: number; missed: boolean; today: boolean }[] = [];
  for (let week = 0; week < WEEKS; week += 1) {
    for (let day = 0; day < DAYS; day += 1) {
      const index = week * DAYS + day;
      cells.push({
        x: week * 14 + 2,
        y: day * 14 + 2,
        missed: MISSED.has(index),
        today: index === WEEKS * DAYS - 1,
      });
    }
  }
  return (
    <svg
      aria-hidden="true"
      data-calendar
      viewBox={`0 0 ${WEEKS * 14} ${DAYS * 14}`}
      className="h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {cells.map((cell) => (
        <line
          key={`${cell.x}-${cell.y}`}
          data-day={cell.today ? "today" : cell.missed ? "missed" : "proof"}
          data-base={cell.today ? 1 : cell.missed ? 0.9 : 0.22}
          x1={cell.x + 5}
          y1={cell.y}
          x2={cell.x + 5}
          y2={cell.y + 10}
          strokeWidth={2}
          strokeDasharray={cell.missed ? "2 2" : undefined}
          className={
            cell.today ? "stroke-signal" : cell.missed ? "stroke-line-strong" : "stroke-text"
          }
          style={{ opacity: cell.today ? 1 : cell.missed ? 0.9 : 0.22 }}
        />
      ))}
    </svg>
  );
}
