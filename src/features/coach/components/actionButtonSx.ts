export const ACTION_BTN_SX = {
  textTransform: 'none' as const,
  fontSize: { xs: '0.72rem', xl: '0.8125rem' },
};

export const ACTION_BTN_START_ICON_SX = {
  ...ACTION_BTN_SX,
  px: { xs: 0.85, xl: 1.5 },
  '& .MuiButton-startIcon': { display: { xs: 'none', xl: 'inherit' } },
};

export const ACTION_BTN_END_ICON_SX = {
  ...ACTION_BTN_SX,
  px: { xs: 0.85, xl: 1.5 },
  '& .MuiButton-endIcon': { display: { xs: 'none', xl: 'inherit' } },
};
