import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  alpha,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';

/**
 * Standalone SOP entries from toolkit.sops (not stored as functions).
 */
const ToolkitSopDetailPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { sopId } = useParams();
  const navigate = useNavigate();
  const [sop, setSop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchData('toolkit');
        const sops = data.toolkit?.sops || [];
        const found = sops.find((s) => s.id === sopId);
        if (found) {
          setSop(found);
        } else {
          setError('SOP not found');
        }
      } catch {
        setError('Failed to load SOP');
      } finally {
        setLoading(false);
      }
    };
    if (sopId) load();
  }, [sopId]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" minHeight={320} alignItems="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !sop) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'SOP not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => navigate('/toolkit')}>
          Back to Toolkit
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/toolkit')}
        sx={{ mb: 3, color: currentTheme.textSecondary }}
      >
        Back to Toolkit
      </Button>
      <Typography variant="overline" sx={{ color: currentTheme.primary, fontWeight: 700 }}>
        Standard operating procedure
      </Typography>
      <Typography variant="h4" sx={{ color: currentTheme.text, fontWeight: 600, mb: 1 }}>
        {sop.displayName || sop.name || sop.id}
      </Typography>
      {sop.description && (
        <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
          {sop.description}
        </Typography>
      )}
      {sop.tags?.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          {sop.tags.map((tag, i) => (
            <Chip
              key={i}
              label={tag}
              size="small"
              sx={{
                bgcolor: alpha(currentTheme.primary, 0.12),
                color: currentTheme.primary,
              }}
            />
          ))}
        </Box>
      )}
      {sop.body && (
        <Typography
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            color: currentTheme.text,
            bgcolor: currentTheme.darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            p: 2,
            borderRadius: 2,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          {sop.body}
        </Typography>
      )}
    </Container>
  );
};

export default ToolkitSopDetailPage;
