import React, { useContext, useMemo } from 'react';
import { Box, Typography, Grid, Paper, Chip } from '@mui/material';
import { ThemeContext } from '../contexts/ThemeContext';
import { catalogInteractivePaperSx } from '../theme/catalogSurfaces';
import { useAuth } from '../contexts/AuthContext';
import { useWorkbenchModals } from '../contexts/WorkbenchModalsContext';
import { getHomeCarouselDisable } from '../utils/disableConfig';

/** Matches UUX dh home workspace tiles; opens the same workbench modals. */
const TILE_IMG_SX = {
  width: 36,
  height: 36,
  objectFit: 'contain',
  display: 'block',
  flexShrink: 0,
};

const workspaceTileImg = (src) => <Box component="img" src={src} alt="" sx={TILE_IMG_SX} />;

const HomeWorkspaceSection = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { canEdit, isAdmin } = useAuth();
  const {
    openQuery,
    openModeling,
    openStudio,
    openReferenceHub,
    openRuleBuilder,
  } = useWorkbenchModals();
  const canEditRules = Boolean(canEdit?.() || isAdmin?.());
  const darkMode = Boolean(currentTheme?.darkMode);

  const workspaceCards = useMemo(() => {
    const cards = [
      {
        id: 'ws-query',
        name: 'Query engine',
        description:
          'Explore datasets and run SQL in the query workbench (Trino-backed query execution when connected).',
        tileMedia: workspaceTileImg('/trino.png'),
        action: openQuery,
        ...getHomeCarouselDisable('query'),
      },
      {
        id: 'ws-modeling',
        name: 'Data modeling',
        description: 'Browse catalog datasets and compose models in the modeling workbench.',
        tileMedia: workspaceTileImg('/modeling-svgrepo-com.svg'),
        action: openModeling,
        ...getHomeCarouselDisable('modeling'),
      },
      {
        id: 'ws-studio',
        name: 'Modeling studio',
        description: 'Query engine and data modeling side by side on wide screens.',
        tileMedia: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 0 }}>
            <Box
              component="img"
              src="/trino.png"
              alt=""
              sx={{ ...TILE_IMG_SX, width: 30, height: 30 }}
            />
            <Box
              component="img"
              src="/modeling-svgrepo-com.svg"
              alt=""
              sx={{ ...TILE_IMG_SX, width: 30, height: 30 }}
            />
          </Box>
        ),
        action: openStudio,
        ...getHomeCarouselDisable('studio'),
      },
      {
        id: 'ws-reference',
        name: 'Reference data',
        description: 'Reference datasets, domains, and Excel import in the reference data hub.',
        tileMedia: workspaceTileImg('/rd.png'),
        action: openReferenceHub,
        ...getHomeCarouselDisable('referenceHub'),
      },
    ];

    if (canEditRules) {
      cards.push({
        id: 'ws-rules',
        name: 'Rule Builder',
        description: 'Author and manage data quality rules for your models.',
        tileMedia: workspaceTileImg('/builder.svg'),
        action: openRuleBuilder,
        ...getHomeCarouselDisable('rules'),
      });
    }

    return cards;
  }, [canEditRules, openQuery, openModeling, openStudio, openReferenceHub, openRuleBuilder]);

  const handleTileClick = (item) => {
    if (item.disabled || typeof item.action !== 'function') return;
    item.action();
  };

  return (
    <Grid container spacing={2}>
        {workspaceCards.map((item) => {
          const inactive = item.disabled;
          return (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Paper
                elevation={0}
                role={inactive ? undefined : 'button'}
                aria-disabled={inactive ? 'true' : undefined}
                tabIndex={inactive ? -1 : 0}
                onClick={() => handleTileClick(item)}
                onKeyDown={(e) => {
                  if (inactive) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTileClick(item);
                  }
                }}
                sx={{
                  p: 2,
                  height: '100%',
                  minHeight: 140,
                  cursor: inactive ? 'not-allowed' : 'pointer',
                  opacity: inactive ? 0.55 : 1,
                  ...catalogInteractivePaperSx(currentTheme),
                  ...(inactive && {
                    boxShadow: darkMode
                      ? '0 4px 20px rgba(0,0,0,0.25)'
                      : '0 4px 16px rgba(15, 35, 52, 0.08)',
                    '&:hover': {
                      borderColor: currentTheme.border,
                      boxShadow: darkMode
                        ? '0 4px 20px rgba(0,0,0,0.25)'
                        : '0 4px 16px rgba(15, 35, 52, 0.08)',
                    },
                  }),
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.25,
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      pt: 0.25,
                      flexShrink: 0,
                      lineHeight: 0,
                    }}
                  >
                    {item.tileMedia}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography
                        component="span"
                        sx={{
                          fontWeight: 700,
                          fontSize: '1.05rem',
                          color: currentTheme.text,
                          lineHeight: 1.25,
                        }}
                      >
                        {item.name}
                      </Typography>
                      {item.comingSoon ? (
                        <Chip label="Coming soon" size="small" sx={{ height: 22, fontSize: '0.7rem' }} />
                      ) : null}
                    </Box>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, lineHeight: 1.5 }}>
                  {item.description}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
    </Grid>
  );
};

export default HomeWorkspaceSection;
