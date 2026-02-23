import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { ThemeContext } from '../contexts/ThemeContext';
import { getPipelines } from '../utils/pipelineUtils';

const PipelineSelectorCarousel = ({ onPipelineSelect, selectedPipeline }) => {
  const { currentTheme } = useContext(ThemeContext);
  const [pipelines, setPipelines] = useState([]);

  useEffect(() => {
    const loadPipelines = async () => {
      const data = await getPipelines();
      setPipelines(data);
    };
    loadPipelines();
  }, []);

  const handlePipelineClick = (pipeline) => {
    if (onPipelineSelect) {
      onPipelineSelect(pipeline);
    }
  };

  // Map pipelines to their logos
  const getPipelineLogo = (pipelineUuid) => {
    const logoMap = {
      '550e8400-e29b-41d4-a716-446655440000': '/eval_icons/T.png', // T
      '550e8400-e29b-41d4-a716-446655440001': '/eval_icons/kubeflow.png', // Kubeflow
      '550e8400-e29b-41d4-a716-446655440002': '/eval_icons/rd.png', // RD
      '550e8400-e29b-41d4-a716-446655440003': '/eval_icons/Dream_Sun_Stone_Sprite.png', // Sun
      '550e8400-e29b-41d4-a716-446655440004': '/eval_icons/torch.png', // Torch
      '550e8400-e29b-41d4-a716-446655440005': '/eval_icons/house.png', // House
    };
    return logoMap[pipelineUuid] || '/pipe-svgrepo-com.svg';
  };

  // Pipeline accent colors for visual distinction
  const pipelineColors = [
    '#2196f3', // Blue for Pipe A
    '#4caf50', // Green for Pipe B
    '#ff9800', // Orange for Pipe C
    '#9c27b0', // Purple for Pipe D
    '#f44336', // Red for Torch
    '#00bcd4', // Cyan for House
  ];

  // Show first 8 pipelines in a 2x4 grid
  const displayedPipelines = pipelines.slice(0, 8);

  if (pipelines.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 4, position: 'relative' }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: 2,
        }}
      >
        {/* Grid Container */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: { xs: 1, sm: 1.5 },
            width: '100%',
          }}
        >
        {displayedPipelines.map((pipeline, index) => {
            const isSelected = selectedPipeline?.uuid === pipeline.uuid;
            const color = pipelineColors[index % pipelineColors.length];
            const logoPath = getPipelineLogo(pipeline.uuid);
            const isRD = pipeline.uuid === '550e8400-e29b-41d4-a716-446655440002';

            return (
              <Box
                key={pipeline.uuid}
                onClick={() => handlePipelineClick(pipeline)}
                sx={{
                  p: { xs: 1, sm: 1.5 },
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: { xs: 0.5, sm: 0.75 },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                  {/* Pipeline Logo */}
                  <Box
                    sx={{
                      width: { xs: isRD ? 48 : 40, sm: isRD ? 56 : 48 },
                      height: { xs: isRD ? 48 : 40, sm: isRD ? 56 : 48 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      opacity: isSelected ? 1 : 0.7,
                      position: 'relative',
                    }}
                  >
                    <Box
                      component="img"
                      src={logoPath}
                      alt={pipeline.name}
                      sx={{
                        width: { xs: isRD ? 44 : 36, sm: isRD ? 52 : 44 },
                        height: { xs: isRD ? 44 : 36, sm: isRD ? 52 : 44 },
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                        transition: 'all 0.3s ease',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      }}
                      onError={(e) => {
                        // Fallback if image doesn't load
                        e.target.style.display = 'none';
                      }}
                    />
                    {/* Test SVG Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: { xs: -2, sm: -3 },
                        right: { xs: -2, sm: -3 },
                        width: { xs: 18, sm: 20 },
                        height: { xs: 18, sm: 20 },
                        borderRadius: '50%',
                        bgcolor: currentTheme.cardBackground || '#fff',
                        border: `1.5px solid ${currentTheme.border || '#e0e0e0'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 1px 4px ${currentTheme.shadow || 'rgba(0,0,0,0.15)'}`,
                        zIndex: 1,
                      }}
                    >
                      <Box
                        component="img"
                        src="/eval_icons/test.svg"
                        alt="Test"
                        sx={{
                          width: { xs: 12, sm: 14 },
                          height: { xs: 12, sm: 14 },
                          objectFit: 'contain',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Pipeline Name */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isSelected ? 700 : 600,
                      color: isSelected
                        ? currentTheme.primary
                        : currentTheme.text,
                      textAlign: 'center',
                      fontSize: { xs: '0.75rem', sm: '0.85rem' },
                      letterSpacing: '0.01em',
                      lineHeight: 1.2,
                    }}
                  >
                    {pipeline.name}
                  </Typography>

                  {/* Pipeline Type */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: currentTheme.textSecondary,
                      textAlign: 'center',
                      textTransform: 'capitalize',
                      fontSize: { xs: '0.6rem', sm: '0.65rem' },
                      fontWeight: 400,
                      letterSpacing: '0.03em',
                      lineHeight: 1.2,
                    }}
                  >
                    {pipeline.type?.replace('-', ' ') || 'Pipeline'}
                  </Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default PipelineSelectorCarousel;
