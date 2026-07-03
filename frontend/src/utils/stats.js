import { isDateInSeason } from './season';
import { ageInYearsExact } from './team';

// Which team a player mostly scored for (used to colour the age/goals plot).
function dominantTeam(goals) {
  let old = 0;
  let young = 0;
  goals.forEach((g) => {
    if (g.is_own_goal) return;
    if (g.team === 'old') old += 1;
    else if (g.team === 'young') young += 1;
  });
  if (old === 0 && young === 0) return null;
  return old >= young ? 'old' : 'young';
}

// Compute everything the Stats page / presentation needs for one season from
// the raw players and matches lists. Pure — no fetching, no dates baked in
// beyond what's in the data (age uses today's date via ageInYears).
export function computeSeasonStats(players, matches, season) {
  const seasonMatches = matches
    .filter((m) => isDateInSeason(m.date, season))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Per-player season tallies (real players only — skip the "Unknown Player").
  const playerStats = players
    .filter((p) => p.name !== 'Unknown Player (Deleted)')
    .map((p) => {
      const goals = p.goals.filter((g) => isDateInSeason(g.match?.date, season));
      return {
        id: p.id,
        name: p.name,
        birthdate: p.birthdate,
        age: ageInYearsExact(p.birthdate),
        goals: goals.filter((g) => !g.is_own_goal).length,
        ownGoals: goals.filter((g) => g.is_own_goal).length,
        team: dominantTeam(goals),
      };
    });

  const leaderboard = playerStats
    .filter((s) => s.goals > 0)
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));

  const podium = leaderboard.slice(0, 3);

  const ownGoalLeader =
    [...playerStats]
      .filter((s) => s.ownGoals > 0)
      .sort((a, b) => b.ownGoals - a.ownGoals || a.name.localeCompare(b.name))[0] || null;

  // Team / match summary.
  const summary = seasonMatches.reduce(
    (acc, m) => {
      acc.oldGoals += m.team_old_score;
      acc.youngGoals += m.team_young_score;
      if (m.team_old_score > m.team_young_score) acc.oldWins += 1;
      else if (m.team_young_score > m.team_old_score) acc.youngWins += 1;
      else acc.draws += 1;
      return acc;
    },
    { oldGoals: 0, youngGoals: 0, oldWins: 0, youngWins: 0, draws: 0 }
  );
  const totalGoals = summary.oldGoals + summary.youngGoals;

  let biggestWin = null;
  seasonMatches.forEach((m) => {
    const diff = Math.abs(m.team_old_score - m.team_young_score);
    if (diff > 0 && (!biggestWin || diff > biggestWin.diff)) {
      biggestWin = {
        date: m.date,
        diff,
        winner: m.team_old_score > m.team_young_score ? 'Team Old' : 'Team Young',
        score: `${m.team_old_score}:${m.team_young_score}`,
      };
    }
  });

  const scatter = playerStats.filter((s) => s.goals > 0 && s.age != null);

  // Goal race: cumulative non-own goals per scorer after each match, in order.
  // Each frame is a snapshot the animated leaderboard steps through.
  const raceScorers = playerStats.filter((s) => s.goals > 0);
  const running = {};
  raceScorers.forEach((s) => {
    running[s.id] = 0;
  });
  const frames = seasonMatches.map((m) => {
    raceScorers.forEach((s) => {
      const player = players.find((p) => p.id === s.id);
      const scored = player.goals.filter((g) => !g.is_own_goal && g.match?.id === m.id).length;
      if (scored) running[s.id] += scored;
    });
    return { date: m.date, cumulative: { ...running } };
  });
  const race = {
    players: raceScorers.map((s) => ({ id: s.id, name: s.name })),
    frames,
    matchCount: seasonMatches.length,
  };

  return {
    race,
    matchCount: seasonMatches.length,
    playerStats,
    leaderboard,
    podium,
    ownGoalLeader,
    summary,
    totalGoals,
    biggestWin,
    scatter,
  };
}
