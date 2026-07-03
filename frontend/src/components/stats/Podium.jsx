import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { getChartColors, medalColor } from '../../utils/chartColors';

// Top-3 goalscorer podium. `entries` is [{name, goals}] already ranked.
// Rendered in classic 2–1–3 visual order with medal-tinted blocks.
const Podium = ({ entries, large = false }) => {
  const theme = useTheme();
  const colors = getChartColors(theme.palette.mode);

  if (!entries || entries.length === 0) {
    return (
      <Typography color="text.secondary">No goals scored this season yet.</Typography>
    );
  }

  // Visual left-to-right order: 2nd, 1st, 3rd (only those that exist).
  const layout = [1, 0, 2].filter((rank) => entries[rank]);
  const heights = large ? { 0: 200, 1: 150, 2: 110 } : { 0: 130, 1: 100, 2: 76 };
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: { xs: 1, sm: 2 },
        width: '100%',
      }}
    >
      {layout.map((rank) => {
        const entry = entries[rank];
        const color = medalColor(colors, rank);
        return (
          <Box
            key={entry.id ?? rank}
            sx={{ flex: '1 1 0', maxWidth: 220, textAlign: 'center' }}
          >
            <Typography sx={{ fontSize: large ? 40 : 28, lineHeight: 1 }}>
              {medals[rank]}
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: large ? 22 : 16,
                mt: 0.5,
                mb: 0.5,
                overflowWrap: 'anywhere',
              }}
            >
              {entry.name}
            </Typography>
            <Typography sx={{ color, fontWeight: 800, fontSize: large ? 34 : 24 }}>
              {entry.goals}
              <Typography component="span" sx={{ color: 'text.secondary', fontSize: large ? 16 : 12, ml: 0.5, fontWeight: 600 }}>
                goals
              </Typography>
            </Typography>
            <Box
              sx={{
                mt: 1,
                height: heights[rank],
                borderRadius: '10px 10px 0 0',
                background: `linear-gradient(180deg, ${color} 0%, ${color}b0 100%)`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                pt: 1,
              }}
            >
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: large ? 30 : 22, textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>
                {rank + 1}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default Podium;
