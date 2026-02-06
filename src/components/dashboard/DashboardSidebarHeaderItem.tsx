import * as React from 'react';
import ListSubheader from '@mui/material/ListSubheader';
import type {} from '@mui/material/themeCssVarsAugmentation';
import DashboardSidebarContext from '../../context/DashboardSidebarContext';
import { DRAWER_WIDTH } from '../../constants/constants';
import { getDrawerSxTransitionMixin } from '../../utils/mixins';
import { sidebar as sidebarTokens } from '../../theme/tokens';

export interface DashboardSidebarHeaderItemProps {
  children?: React.ReactNode;
}

export default function DashboardSidebarHeaderItem({
  children,
}: DashboardSidebarHeaderItemProps) {
  const sidebarContext = React.useContext(DashboardSidebarContext);
  if (!sidebarContext) {
    throw new Error('Sidebar context was used without a provider.');
  }
  const {
    mini = false,
    fullyExpanded = true,
    hasDrawerTransitions,
  } = sidebarContext;

  return (
    <ListSubheader
      sx={{
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        height: mini ? 0 : 36,
        ...(hasDrawerTransitions
          ? getDrawerSxTransitionMixin(fullyExpanded, 'height')
          : {}),
        px: 1.5,
        py: 0,
        minWidth: DRAWER_WIDTH,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        zIndex: 2,
        backgroundColor: 'transparent',
        color: sidebarTokens.headerColor,
        lineHeight: '36px',
      }}
    >
      {children}
    </ListSubheader>
  );
}