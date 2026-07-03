import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { ALL_SEASONS, getSeasonLabel } from '../utils/season';

// Dropdown to pick a season to filter stats by.
//
// `seasons` is a list of season start years (newest first). The currently
// selected season is always shown as an option even if it has no data yet, so
// the selection never silently disappears.
const SeasonSelector = ({ value, onChange, seasons, allowAllTime = true }) => {
  const options = [...seasons];
  if (value !== ALL_SEASONS && value != null && !options.includes(value)) {
    options.push(value);
    options.sort((a, b) => b - a);
  }

  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel id="season-select-label">Season</InputLabel>
      <Select
        labelId="season-select-label"
        label="Season"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {allowAllTime && <MenuItem value={ALL_SEASONS}>{getSeasonLabel(ALL_SEASONS)}</MenuItem>}
        {options.map((startYear) => (
          <MenuItem key={startYear} value={startYear}>
            {getSeasonLabel(startYear)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SeasonSelector;
