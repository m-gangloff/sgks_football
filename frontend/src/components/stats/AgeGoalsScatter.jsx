import React, { useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { getChartColors } from '../../utils/chartColors';

// Scatter of player age (x) vs goals scored (y), coloured by the team the
// player mostly played for. Two series -> a legend is always present, so
// identity is never colour-alone.
const AgeGoalsScatter = ({ data }) => {
  const theme = useTheme();
  const colors = getChartColors(theme.palette.mode);
  const [activeId, setActiveId] = useState(null);

  if (!data || data.length === 0) {
    return <Typography color="text.secondary">Not enough data for this season.</Typography>;
  }

  const width = 720;
  const height = 320;
  const m = { top: 16, right: 20, bottom: 40, left: 44 };
  const plotW = width - m.left - m.right;
  const plotH = height - m.top - m.bottom;

  const ages = data.map((d) => d.age);
  const minAge = Math.min(...ages) - 1;
  const maxAge = Math.max(...ages) + 1;
  const maxGoals = Math.max(...data.map((d) => d.goals), 1);

  const xFor = (age) => m.left + ((age - minAge) / (maxAge - minAge || 1)) * plotW;
  const yFor = (g) => m.top + plotH - (g / maxGoals) * plotH;

  const teamColor = (team) => (team === 'young' ? colors.teamYoung : colors.teamOld);

  const yTicks = [0, Math.ceil(maxGoals / 2), maxGoals];
  const ageTickStep = Math.max(1, Math.round((maxAge - minAge) / 5));
  const ageTicks = [];
  for (let a = Math.ceil(minAge); a <= Math.floor(maxAge); a += ageTickStep) ageTicks.push(a);

  const topScorer = data.reduce((a, b) => (b.goals > a.goals ? b : a), data[0]);

  // Least-squares best-fit line (goals ~ age), drawn dashed as a reference.
  let fit = null;
  if (data.length >= 2) {
    const n = data.length;
    let sx = 0;
    let sy = 0;
    let sxx = 0;
    let sxy = 0;
    data.forEach((d) => {
      sx += d.age;
      sy += d.goals;
      sxx += d.age * d.age;
      sxy += d.age * d.goals;
    });
    const denom = n * sxx - sx * sx;
    if (Math.abs(denom) > 1e-9) {
      const slope = (n * sxy - sx * sy) / denom;
      const intercept = (sy - slope * sx) / n;
      fit = { slope, intercept };
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          role="img"
          aria-label="Player age versus goals"
          style={{ maxWidth: width, fontFamily: 'inherit' }}
        >
          {yTicks.map((v) => (
            <g key={`y${v}`}>
              <line x1={m.left} y1={yFor(v)} x2={m.left + plotW} y2={yFor(v)} stroke={colors.grid} strokeWidth="1" />
              <text x={m.left - 8} y={yFor(v)} textAnchor="end" dominantBaseline="central" fontSize="11" fill={colors.muted} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {v}
              </text>
            </g>
          ))}
          {ageTicks.map((a) => (
            <text key={`x${a}`} x={xFor(a)} y={m.top + plotH + 16} textAnchor="middle" fontSize="11" fill={colors.muted} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {a}
            </text>
          ))}
          <text x={m.left + plotW / 2} y={height - 4} textAnchor="middle" fontSize="12" fill={colors.ink2}>
            Age
          </text>
          <text transform={`translate(12 ${m.top + plotH / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill={colors.ink2}>
            Goals
          </text>

          {/* best-fit line (clipped to the plot area) */}
          {fit && (
            <>
              <defs>
                <clipPath id="age-goals-plot">
                  <rect x={m.left} y={m.top} width={plotW} height={plotH} />
                </clipPath>
              </defs>
              <line
                clipPath="url(#age-goals-plot)"
                x1={xFor(minAge)}
                y1={yFor(fit.intercept + fit.slope * minAge)}
                x2={xFor(maxAge)}
                y2={yFor(fit.intercept + fit.slope * maxAge)}
                stroke={colors.ink2}
                strokeWidth="2"
                strokeDasharray="6 5"
                opacity="0.7"
              />
            </>
          )}

          {data.map((d) => {
            const isActive = d.id === activeId;
            return (
              <circle
                key={d.id ?? d.name}
                cx={xFor(d.age)}
                cy={yFor(d.goals)}
                r={isActive ? 8 : 6}
                fill={teamColor(d.team)}
                fillOpacity={activeId && !isActive ? 0.3 : 0.85}
                stroke={isActive ? colors.ink : colors.surface}
                strokeWidth={isActive ? 2 : 1.5}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setActiveId(d.id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={() => setActiveId((prev) => (prev === d.id ? null : d.id))}
              />
            );
          })}

          {/* direct-label the top scorer when nothing is actively selected */}
          {!activeId && (
            <text
              x={xFor(topScorer.age)}
              y={yFor(topScorer.goals) - 10}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill={colors.ink}
            >
              {topScorer.name.split(' ')[0]}
            </text>
          )}

          {/* interactive tooltip for the hovered / tapped point */}
          {(() => {
            const active = data.find((d) => d.id === activeId);
            if (!active) return null;
            const cx = xFor(active.age);
            const cy = yFor(active.goals);
            const line1 = active.name;
            const line2 = `Age ${active.age.toFixed(1)} · ${active.goals} goals`;
            const w = Math.max(line1.length, line2.length) * 6.7 + 16;
            const h = 40;
            let tx = cx - w / 2;
            if (tx < m.left) tx = m.left;
            if (tx + w > m.left + plotW) tx = m.left + plotW - w;
            let ty = cy - h - 12;
            if (ty < m.top) ty = cy + 14;
            return (
              <g pointerEvents="none">
                <circle cx={cx} cy={cy} r="8" fill={teamColor(active.team)} stroke={colors.ink} strokeWidth="2" />
                <rect x={tx} y={ty} width={w} height={h} rx="6" fill={colors.surface} stroke={colors.axis} strokeWidth="1" />
                <text x={tx + 8} y={ty + 16} fontSize="12.5" fontWeight="700" fill={colors.ink}>{line1}</text>
                <text x={tx + 8} y={ty + 32} fontSize="11.5" fill={colors.ink2}>{line2}</text>
              </g>
            );
          })()}
        </svg>
      </Box>

      {/* legend */}
      <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'center' }}>
        {[
          { label: 'Team Old', color: colors.teamOld },
          { label: 'Team Young', color: colors.teamYoung },
        ].map((s) => (
          <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: s.color }} />
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
        Hover or tap a dot to see the player
      </Typography>
    </Box>
  );
};

export default AgeGoalsScatter;
