// Season handling.
//
// A season runs from mid-June to mid-June (the club's off-season is early
// summer). A match played on/after the cutoff belongs to the season that
// starts that calendar year; a match before the cutoff belongs to the season
// that started the previous year.
//
// The cutoff is a single constant here — change these two values if the
// season cadence ever shifts.
export const SEASON_CUTOFF_MONTH = 6; // June (1-indexed)
export const SEASON_CUTOFF_DAY = 15; // mid-June

// Sentinel used by the season selector to mean "don't filter".
export const ALL_SEASONS = 'all';

// Returns the start year of the season a date belongs to.
// e.g. 2026-03-01 -> 2025, 2026-07-01 -> 2026
export function getSeasonStartYear(dateInput) {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const afterCutoff =
    month > SEASON_CUTOFF_MONTH ||
    (month === SEASON_CUTOFF_MONTH && day >= SEASON_CUTOFF_DAY);
  return afterCutoff ? year : year - 1;
}

// Human-readable label for a season, e.g. 2025 -> "2025/26".
export function getSeasonLabel(startYear) {
  if (startYear === ALL_SEASONS || startYear == null) return 'All time';
  const endYear = (startYear + 1) % 100;
  return `${startYear}/${endYear.toString().padStart(2, '0')}`;
}

// The season that the current date falls into.
export function getCurrentSeasonStartYear() {
  return getSeasonStartYear(new Date());
}

// Unique season start years present in a list of dates, sorted newest first.
export function seasonsFromDates(dates) {
  const years = new Set();
  dates.forEach((date) => {
    if (date) years.add(getSeasonStartYear(date));
  });
  return Array.from(years).sort((a, b) => b - a);
}

// Whether a date belongs to the given season (ALL_SEASONS matches everything).
export function isDateInSeason(dateInput, seasonStartYear) {
  if (seasonStartYear === ALL_SEASONS || seasonStartYear == null) return true;
  return getSeasonStartYear(dateInput) === seasonStartYear;
}

// Effective "hidden" state of a player for a season, given the sparse list of
// visibility overrides ([{ player_id, season_start_year, hidden }]).
//
// The most recent override in any season <= the viewed one wins; if there is
// none, the player is visible. This makes a season inherit the previous
// season's state until an admin changes it. "All time" never hides anyone.
export function isPlayerHidden(overrides, playerId, seasonStartYear) {
  if (seasonStartYear === ALL_SEASONS || seasonStartYear == null) return false;
  let best = null;
  for (const o of overrides) {
    if (o.player_id !== playerId) continue;
    if (o.season_start_year > seasonStartYear) continue;
    if (!best || o.season_start_year > best.season_start_year) best = o;
  }
  return best ? best.hidden : false;
}

// The explicit override for a player in exactly this season, or null if the
// state is inherited from an earlier season / the default.
export function getExplicitOverride(overrides, playerId, seasonStartYear) {
  if (seasonStartYear === ALL_SEASONS || seasonStartYear == null) return null;
  return (
    overrides.find(
      (o) => o.player_id === playerId && o.season_start_year === seasonStartYear
    ) || null
  );
}
