// Helpers for suggesting which team a goalscorer likely plays for.

// Age in whole years from a birthdate string, or null if unavailable.
export function ageInYears(birthdate) {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age;
}

function median(numbers) {
  if (!numbers.length) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Suggest 'old' or 'young' for a player:
//   1. Their most recent goal's team (people usually stay on the same team).
//   2. Otherwise, compare their age to the median age of active players
//      (at/above the median -> 'old', below -> 'young').
// Returns '' when there's no basis to guess.
export function suggestTeamForPlayer(player, activePlayers = []) {
  if (!player) return '';

  const datedGoals = (player.goals || []).filter(
    (g) => g.match?.date && (g.team === 'old' || g.team === 'young')
  );
  if (datedGoals.length) {
    const last = datedGoals.reduce((a, b) =>
      new Date(a.match.date) >= new Date(b.match.date) ? a : b
    );
    return last.team;
  }

  const age = ageInYears(player.birthdate);
  const ages = activePlayers.map((p) => ageInYears(p.birthdate)).filter((a) => a != null);
  const med = median(ages);
  if (age != null && med != null) return age >= med ? 'old' : 'young';

  return '';
}
