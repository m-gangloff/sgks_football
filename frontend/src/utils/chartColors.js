// Validated chart palette (see dataviz skill). Light and dark are each stepped
// for their own surface, not a naive flip. Categorical hues are used in fixed
// order. Light-mode aqua/yellow sit below 3:1 contrast, so charts that use them
// carry direct labels (never colour-alone).
export function getChartColors(mode) {
  const dark = mode === 'dark';
  return {
    surface: dark ? '#1a1a19' : '#fcfcfb',
    ink: dark ? '#ffffff' : '#0b0b0b',
    ink2: dark ? '#c3c2b7' : '#52514e',
    muted: '#898781',
    grid: dark ? '#2c2c2a' : '#e1e0d9',
    axis: dark ? '#383835' : '#c3c2b7',
    series: dark
      ? ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767']
      : ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948'],
    accent: dark ? '#3987e5' : '#2a78d6',
    teamOld: dark ? '#3987e5' : '#2a78d6',
    teamYoung: dark ? '#d95926' : '#eb6834',
    gold: dark ? '#c98500' : '#eda100',
    silver: dark ? '#9a9a9a' : '#9e9c96',
    bronze: dark ? '#b06a2f' : '#b3702f',
  };
}

// Medal colour for a podium rank (0 = gold).
export function medalColor(colors, rank) {
  return [colors.gold, colors.silver, colors.bronze][rank] || colors.accent;
}
