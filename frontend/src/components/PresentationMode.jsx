import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, Box, Typography, IconButton, Button, useTheme } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import { getChartColors, medalColor } from '../utils/chartColors';
import Podium from './stats/Podium';
import LeaderboardChart from './stats/LeaderboardChart';
import GoalRaceChart from './stats/GoalRaceChart';
import AgeGoalsScatter from './stats/AgeGoalsScatter';

const PLACE_META = [
  { emoji: '🥇', label: 'Champion' },
  { emoji: '🥈', label: 'Runner-up' },
  { emoji: '🥉', label: 'Third place' },
];

// Full-screen slide deck for presenting the season awards. One slide shown at a
// time; navigate with the on-screen arrows or ←/→ (Space also advances).
const PresentationMode = ({ open, onClose, stats, seasonLabel }) => {
  const theme = useTheme();
  const colors = getChartColors(theme.palette.mode);
  const [index, setIndex] = useState(0);

  // Build the slide list from available data.
  const slides = [{ kind: 'title' }];
  if (stats.ownGoalLeader) slides.push({ kind: 'ownGoals' });
  // The race plays out the whole season, then we reveal the podium places.
  if (stats.race.matchCount > 0 && stats.race.players.length > 0) slides.push({ kind: 'race' });
  [2, 1, 0].forEach((rank) => {
    if (stats.podium[rank]) slides.push({ kind: 'place', rank });
  });
  slides.push({ kind: 'podium' });
  slides.push({ kind: 'leaderboard' });
  if (stats.scatter.length) slides.push({ kind: 'scatter' });
  slides.push({ kind: 'summary' });

  const count = slides.length;
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, count - 1)), [count]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, next, prev]);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const slide = slides[index] || slides[0];

  const renderSlide = () => {
    switch (slide.kind) {
      case 'title':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 64 }}>⚽🏆</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 36, sm: 56 } }}>
              Season {seasonLabel}
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mt: 1 }}>
              Goalscorer Awards
            </Typography>
          </Box>
        );
      case 'ownGoals':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 64 }}>🙈</Typography>
            <Typography variant="h5" color="text.secondary">Special mention</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 30, sm: 44 }, mt: 1 }}>
              {stats.ownGoalLeader.name}
            </Typography>
            <Typography variant="h6" sx={{ mt: 1 }}>
              {stats.ownGoalLeader.ownGoals} own goal{stats.ownGoalLeader.ownGoals !== 1 ? 's' : ''} — we still love you!
            </Typography>
          </Box>
        );
      case 'place': {
        const meta = PLACE_META[slide.rank];
        const entry = stats.podium[slide.rank];
        const color = medalColor(colors, slide.rank);
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: { xs: 72, sm: 96 } }}>{meta.emoji}</Typography>
            <Typography variant="h5" color="text.secondary">{meta.label}</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 40, sm: 64 }, mt: 1, overflowWrap: 'anywhere' }}>
              {entry.name}
            </Typography>
            <Typography sx={{ color, fontWeight: 800, fontSize: { xs: 44, sm: 72 } }}>
              {entry.goals} <Typography component="span" variant="h5" color="text.secondary">goals</Typography>
            </Typography>
          </Box>
        );
      }
      case 'podium':
        return (
          <Box sx={{ width: '100%', maxWidth: 760 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center', mb: 3 }}>The Podium</Typography>
            <Podium entries={stats.podium} large />
          </Box>
        );
      case 'leaderboard':
        return (
          <Box sx={{ width: '100%', maxWidth: 820 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center', mb: 3 }}>Leaderboard</Typography>
            <LeaderboardChart data={stats.leaderboard} />
          </Box>
        );
      case 'race':
        return (
          <Box sx={{ width: '100%', maxWidth: 820 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center', mb: 3 }}>The Goal Race</Typography>
            <GoalRaceChart race={stats.race} autoPlay />
          </Box>
        );
      case 'scatter':
        return (
          <Box sx={{ width: '100%', maxWidth: 820 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center', mb: 3 }}>Age vs Goals</Typography>
            <AgeGoalsScatter data={stats.scatter} />
          </Box>
        );
      case 'summary':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>The Season in Numbers</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
              {[
                ['Matches', stats.matchCount],
                ['Total goals', stats.totalGoals],
                ['Team Old wins', stats.summary.oldWins],
                ['Team Young wins', stats.summary.youngWins],
                ['Draws', stats.summary.draws],
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography sx={{ fontWeight: 800, fontSize: 48 }}>{value}</Typography>
                  <Typography variant="body1" color="text.secondary">{label}</Typography>
                </Box>
              ))}
            </Box>
            {stats.biggestWin && (
              <Typography variant="h6" color="text.secondary" sx={{ mt: 4 }}>
                Biggest win: {stats.biggestWin.winner} by {stats.biggestWin.diff} ({stats.biggestWin.score})
              </Typography>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        {/* top bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
            {index + 1} / {count}
          </Typography>
          <IconButton onClick={onClose} aria-label="Exit presentation">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* slide */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, sm: 6 },
            py: 2,
            overflow: 'auto',
          }}
        >
          <Box key={index} sx={{ width: '100%', display: 'flex', justifyContent: 'center', animation: 'sgksFade 400ms ease' }}>
            {renderSlide()}
          </Box>
        </Box>

        {/* controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button startIcon={<ChevronLeftIcon />} onClick={prev} disabled={index === 0}>
            Back
          </Button>
          <Button variant="contained" endIcon={<ChevronRightIcon />} onClick={next} disabled={index === count - 1}>
            Next
          </Button>
        </Box>
      </Box>

      <style>{`@keyframes sgksFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
    </Dialog>
  );
};

export default PresentationMode;
