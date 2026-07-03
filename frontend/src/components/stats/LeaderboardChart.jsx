import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { getChartColors, medalColor } from '../../utils/chartColors';

// Horizontal bar chart of goals per player, ranked. Single measure (goals), so
// one hue — except the top 3, tinted with medal colours. Every bar is direct-
// labelled with its value, and names sit in ink (never the bar colour).
const LeaderboardChart = ({ data }) => {
  const theme = useTheme();
  const colors = getChartColors(theme.palette.mode);

  if (!data || data.length === 0) {
    return <Typography color="text.secondary">No goalscorers this season.</Typography>;
  }

  const rowH = 30;
  const gap = 8;
  const labelW = 150;
  const valueW = 34;
  const width = 720;
  const plotW = width - labelW - valueW;
  const height = data.length * (rowH + gap);
  const maxGoals = Math.max(...data.map((d) => d.goals), 1);

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label="Goals per player"
        style={{ maxWidth: width, fontFamily: 'inherit' }}
      >
        {data.map((d, i) => {
          const y = i * (rowH + gap);
          const w = Math.max((d.goals / maxGoals) * plotW, 2);
          const fill = i < 3 ? medalColor(colors, i) : colors.accent;
          return (
            <g key={d.id ?? d.name}>
              <text
                x={labelW - 8}
                y={y + rowH / 2}
                textAnchor="end"
                dominantBaseline="central"
                fontSize="13"
                fontWeight={i < 3 ? 700 : 500}
                fill={colors.ink}
              >
                {d.name.length > 20 ? `${d.name.slice(0, 19)}…` : d.name}
              </text>
              <rect
                x={labelW}
                y={y}
                width={w}
                height={rowH}
                rx="4"
                fill={fill}
              >
                <title>{`${d.name}: ${d.goals} goals`}</title>
              </rect>
              <text
                x={labelW + w + 6}
                y={y + rowH / 2}
                dominantBaseline="central"
                fontSize="13"
                fontWeight="700"
                fill={colors.ink}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {d.goals}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

export default LeaderboardChart;
