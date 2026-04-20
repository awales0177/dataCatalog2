import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Chip,
  alpha,
} from '@mui/material';
import {
  PushPin as PinIcon,
  Storage as StorageIcon,
  DataObject as ModelIcon,
  Description as AgreementIcon,
  Folder as DomainIcon,
  Apps as ApplicationIcon,
  Build as ToolkitIcon,
  Policy as PolicyIcon,
  MenuBook as LexiconIcon,
} from '@mui/icons-material';
import DataModelCard from './DataModelCard';
import ProductAgreementCard from './ProductAgreementCard';
import DomainCard from './DomainCard';
import ApplicationCard from './ApplicationCard';
import GlossaryCard from './GlossaryCard';
import DataPolicyCard from './DataPolicyCard';
import ToolkitPinnedCard, { findToolkitItemForPin } from './ToolkitPinnedCard';
import { catalogInteractivePaperSx } from '../theme/catalogSurfaces';
import modelsData from '../data/models.json';
import { getSearchTypeLabel } from '../utils/catalogSearchNavigation';
import { entityMatchesPinId, lexiconTermForGlossaryCard } from '../utils/homePinnedHelpers';

function getTypeIcon(type) {
  const iconMap = {
    models: <ModelIcon />,
    dataAgreements: <AgreementIcon />,
    domains: <DomainIcon />,
    applications: <ApplicationIcon />,
    toolkit: <ToolkitIcon />,
    policies: <PolicyIcon />,
    lexicon: <LexiconIcon />,
    glossary: <LexiconIcon />,
  };
  return iconMap[type] || <StorageIcon />;
}

function HomePinnedMasonryItem({
  item,
  pinCatalog,
  currentTheme,
  onUnpin,
  onOpenPinned,
  canEditGlossary,
}) {
  const navigate = useNavigate();

  const handleUnpinClick = useCallback(
    (e) => {
      e.stopPropagation();
      onUnpin(item.id, item.searchType);
    },
    [item.id, item.searchType, onUnpin]
  );

  const pinShell = (child) => (
    <Box sx={{ position: 'relative', overflow: 'visible', width: '100%' }}>
      <IconButton
        size="small"
        onClick={handleUnpinClick}
        aria-label="Unpin"
        sx={{
          position: 'absolute',
          bottom: 12,
          right: -16,
          zIndex: 20,
          bgcolor: currentTheme.primary,
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px 0 0 4px',
          boxShadow: `0 2px 8px ${alpha(currentTheme.primary, 0.3)}`,
          clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)',
          '&:hover': {
            bgcolor: currentTheme.primaryHover,
            boxShadow: `0 2px 12px ${alpha(currentTheme.primary, 0.4)}`,
          },
        }}
      >
        <PinIcon sx={{ color: 'white', fontSize: 18 }} />
      </IconButton>
      <Box sx={{ '& .MuiCard-root': { height: 'auto' } }}>{child}</Box>
    </Box>
  );

  if (item.searchType === 'models') {
    const staticList = Array.isArray(modelsData) ? modelsData : modelsData.models || [];
    const model =
      staticList.find((m) => String(m.uuid || m.shortName || m.id) === String(item.id)) ||
      pinCatalog.apiModels.find((m) => entityMatchesPinId(m, item.id));
    if (model) {
      return pinShell(<DataModelCard model={model} currentTheme={currentTheme} />);
    }
  }

  if (item.searchType === 'dataAgreements') {
    const agreement = pinCatalog.agreements.find((a) => entityMatchesPinId(a, item.id));
    if (agreement) {
      return pinShell(
        <ProductAgreementCard
          agreement={agreement}
          currentTheme={currentTheme}
          applications={pinCatalog.applications}
        />
      );
    }
  }

  if (item.searchType === 'domains') {
    const domain = pinCatalog.domains.find(
      (d) => entityMatchesPinId(d, item.id) || String(d.name) === String(item.name)
    );
    if (domain) {
      return pinShell(
        <DomainCard domain={domain} onClick={() => onOpenPinned(item)} currentTheme={currentTheme} />
      );
    }
  }

  if (item.searchType === 'applications') {
    const application = pinCatalog.applications.find((a) => entityMatchesPinId(a, item.id));
    if (application) {
      const target =
        item.path && item.path !== '/applications'
          ? item.path
          : `/applications/edit/${encodeURIComponent(application.uuid || application.id)}`;
      return pinShell(
        <Box onClick={() => navigate(target)} sx={{ cursor: 'pointer' }}>
          <ApplicationCard application={application} currentTheme={currentTheme} />
        </Box>
      );
    }
  }

  if (item.searchType === 'policies') {
    const policy = pinCatalog.policies.find((p) => entityMatchesPinId(p, item.id));
    if (policy) {
      return pinShell(
        <Box onClick={() => onOpenPinned(item)} sx={{ cursor: 'pointer' }}>
          <DataPolicyCard
            policy={policy}
            currentTheme={currentTheme}
            sx={{ height: 'auto', minHeight: 0 }}
          />
        </Box>
      );
    }
  }

  if (item.searchType === 'glossary') {
    const term = pinCatalog.glossaryTerms.find((t) => entityMatchesPinId(t, item.id));
    if (term) {
      return pinShell(
        <Box onClick={() => onOpenPinned(item)} sx={{ cursor: 'pointer' }}>
          <GlossaryCard
            term={term}
            currentTheme={currentTheme}
            dataModels={pinCatalog.apiModels}
            canEdit={canEditGlossary}
          />
        </Box>
      );
    }
  }

  if (item.searchType === 'lexicon') {
    const lex = pinCatalog.lexiconTerms.find((t) => entityMatchesPinId(t, item.id));
    if (lex) {
      return pinShell(
        <Box onClick={() => onOpenPinned(item)} sx={{ cursor: 'pointer' }}>
          <GlossaryCard
            term={lexiconTermForGlossaryCard(lex)}
            currentTheme={currentTheme}
            dataModels={pinCatalog.apiModels}
            canEdit={false}
          />
        </Box>
      );
    }
  }

  if (item.searchType === 'toolkit') {
    const tkItem = findToolkitItemForPin(pinCatalog.toolkit, item);
    if (tkItem) {
      return pinShell(<ToolkitPinnedCard pin={item} item={tkItem} currentTheme={currentTheme} />);
    }
  }

  return pinShell(
    <Paper
      elevation={0}
      onClick={() => onOpenPinned(item)}
      sx={{
        p: 2,
        minHeight: 140,
        cursor: 'pointer',
        position: 'relative',
        ...catalogInteractivePaperSx(currentTheme),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ color: currentTheme.primary, display: 'flex', alignItems: 'center' }}>
          {getTypeIcon(item.searchType)}
        </Box>
        <Chip
          size="small"
          label={getSearchTypeLabel(item.searchType)}
          variant="outlined"
          sx={{ borderColor: currentTheme.primary, color: currentTheme.primary }}
        />
      </Box>
      <Typography variant="subtitle1" sx={{ color: currentTheme.text, fontWeight: 600, mb: 0.5 }}>
        {item.name}
      </Typography>
      <Typography variant="caption" sx={{ color: currentTheme.textSecondary, wordBreak: 'break-all' }}>
        {item.path}
      </Typography>
    </Paper>
  );
}

export default memo(HomePinnedMasonryItem);
