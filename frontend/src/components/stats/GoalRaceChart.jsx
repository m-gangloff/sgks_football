import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Slider, Typography, useTheme } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import { getChartColors, medalColor } from '../../utils/chartColors';

const ROW_H = 42;
const MEDALS = ['🥇', '🥈', '🥉'];

// Animated "bar chart race": each scorer's cumulative goals grow and the rows
// reorder match by match. Rows are keyed by player id and slide via CSS
// transitions, so overtakes animate smoothly. Ends on the final standings.
const GoalRaceChart = ({ race, autoPlay = false, topN = 8 }) => {
  const theme = useTheme();
  const colors = getChartColors(theme.palette.mode);
  const { frames, matchCount } = race;

  const [step, setStep] = useState(0); // 0 = before any match, matchCount = final
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const perStep = Math.max(800, Math.min(2000, Math.round(18000 / Math.max(matchCount, 1))));

  useEffect(() => {
    if (!playing) return undefined;
    if (step >= matchCount) {
      setPlaying(false);
      return undefined;
    }
    timer.current = setTimeout(() => setStep((s) => s + 1), perStep);
    return () => clearTimeout(timer.current);
  }, [playing, step, matchCount, perStep]);

  useEffect(() => {
    if (autoPlay) {
      setStep(0);
      setPlaying(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, race]);

  const play = () => {
    if (step >= matchCount) setStep(0);
    setPlaying(true);
  };
  const pause = () => setPlaying(false);

  if (!frames || matchCount === 0 || race.players.length === 0) {
    return <Typography color="text.secondary">No goalscorers to race this season.</Typography>;
  }

  // Standings at the current step.
  const cumulative = step === 0 ? {} : frames[step - 1].cumulative;
  const label = step === 0 ? 'Kickoff' : frames[step - 1].date;

  const standings = race.players
    .map((p) => ({ ...p, goals: cumulative[p.id] || 0 }))
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));

  const maxVal = Math.max(standings[0]?.goals || 0, 1);
  const shown = standings.slice(0, topN);
  const rankById = new Map(standings.map((p, i) => [p.id, i]));

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          Match {step} / {matchCount}
        </Typography>
      </Box>

      <Box sx={{ position: 'relative', height: topN * ROW_H }}>
        {shown.map((p) => {
          const rank = rankById.get(p.id);
          const pct = (p.goals / maxVal) * 100;
          const barColor = rank < 3 ? medalColor(colors, rank) : colors.accent;
          return (
            <Box
              key={p.id}
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: ROW_H - 6,
                display: 'flex',
                alignItems: 'center',
                transform: `translateY(${rank * ROW_H}px)`,
                transition: 'transform 0.7s ease',
              }}
            >
              <Box
                sx={{
                  width: 150,
                  pr: 1,
                  flexShrink: 0,
                  textAlign: 'right',
                  fontWeight: rank < 3 ? 700 : 500,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {rank < 3 ? `${MEDALS[rank]} ` : ''}{p.name}
              </Box>
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    height: ROW_H - 12,
                    width: `${pct}%`,
                    minWidth: 2,
                    borderRadius: 1,
                    bgcolor: barColor,
                    transition: 'width 0.7s ease, background-color 0.7s ease',
                  }}
                />
                <Typography sx={{ ml: 1, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {p.goals}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
        <Button
          size="small"
          variant="contained"
          startIcon={playing ? <PauseIcon /> : step >= matchCount ? <ReplayIcon /> : <PlayArrowIcon />}
          onClick={playing ? pause : play}
        >
          {playing ? 'Pause' : step >= matchCount ? 'Replay' : 'Play'}
        </Button>
        <Slider
          size="small"
          min={0}
          max={matchCount}
          value={step}
          onChange={(e, v) => {
            setPlaying(false);
            setStep(v);
          }}
          sx={{ flexGrow: 1 }}
          aria-label="Match progress"
        />
      </Box>
    </Box>
  );
};

export default GoalRaceChart;
