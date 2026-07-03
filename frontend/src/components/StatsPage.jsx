import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import { getPlayers, getMatches } from '../api';
import { getSeasonLabel } from '../utils/season';
import { computeSeasonStats } from '../utils/stats';
import SeasonSelector from './SeasonSelector';
import Podium from './stats/Podium';
import LeaderboardChart from './stats/LeaderboardChart';
import GoalRaceChart from './stats/GoalRaceChart';
import AgeGoalsScatter from './stats/AgeGoalsScatter';
import PresentationMode from './PresentationMode';
import { seasonsFromDates } from '../utils/season';

const StatTile = ({ label, value, color }) => (
  <Paper variant="outlined" sx={{ p: 1.5, flex: '1 1 120px', minWidth: 100, textAlign: 'center' }}>
    <Typography variant="h5" sx={{ fontWeight: 'bold', color: color || 'text.primary' }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Paper>
);

const Section = ({ title, children, action }) => (
  <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
      <Typography variant="h6">{title}</Typography>
      {action}
    </Box>
    {children}
  </Paper>
);

const StatsPage = ({ globalPassword, selectedSeason, onSeasonChange }) => {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [presenting, setPresenting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [pRes, mRes] = await Promise.all([getPlayers(globalPassword), getMatches(globalPassword)]);
        if (!active) return;
        if (pRes.ok && mRes.ok) {
          setPlayers(await pRes.json());
          setMatches(await mRes.json());
        } else {
          setError('Failed to load stats data');
        }
      } catch (e) {
        if (active) setError('Failed to load stats data');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [globalPassword]);

  const availableSeasons = seasonsFromDates(matches.map((m) => m.date));
  const stats = computeSeasonStats(players, matches, selectedSeason);
  const seasonLabel = getSeasonLabel(selectedSeason);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const hasData = stats.matchCount > 0;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1,
          mb: 3,
        }}
      >
        <Typography variant="h5">Season Stats — {seasonLabel}</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <SeasonSelector value={selectedSeason} onChange={onSeasonChange} seasons={availableSeasons} />
          <Button
            variant="contained"
            startIcon={<SlideshowIcon />}
            onClick={() => setPresenting(true)}
            disabled={!hasData}
          >
            Present
          </Button>
        </Box>
      </Box>

      {!hasData ? (
        <Alert severity="info">No matches recorded for {seasonLabel}. Pick another season.</Alert>
      ) : (
        <>
          <Section title="Overview">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <StatTile label="Matches" value={stats.matchCount} />
              <StatTile label="Total Goals" value={stats.totalGoals} />
              <StatTile label="Team Old Wins" value={stats.summary.oldWins} />
              <StatTile label="Team Young Wins" value={stats.summary.youngWins} />
              <StatTile label="Draws" value={stats.summary.draws} />
              <StatTile label="Goalscorers" value={stats.leaderboard.length} />
            </Box>
            {stats.biggestWin && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Biggest win: <strong>{stats.biggestWin.winner}</strong> by {stats.biggestWin.diff} ({stats.biggestWin.score}) on {stats.biggestWin.date}
              </Typography>
            )}
          </Section>

          <Section title="Top 3 Goalscorers">
            <Podium entries={stats.podium} />
          </Section>

          {stats.ownGoalLeader && (
            <Section title="Special Mention 🙈">
              <Typography variant="body1">
                Most own goals: <strong>{stats.ownGoalLeader.name}</strong> with{' '}
                <strong>{stats.ownGoalLeader.ownGoals}</strong> own goal
                {stats.ownGoalLeader.ownGoals !== 1 ? 's' : ''}. We still love you!
              </Typography>
            </Section>
          )}

          <Section title="Goalscorer Leaderboard">
            <LeaderboardChart data={stats.leaderboard} />
          </Section>

          <Section title="Goal Race">
            <GoalRaceChart race={stats.race} />
          </Section>

          <Section title="Age vs Goals">
            <AgeGoalsScatter data={stats.scatter} />
          </Section>
        </>
      )}

      {presenting && (
        <PresentationMode
          open={presenting}
          onClose={() => setPresenting(false)}
          stats={stats}
          seasonLabel={seasonLabel}
        />
      )}
    </Box>
  );
};

export default StatsPage;
