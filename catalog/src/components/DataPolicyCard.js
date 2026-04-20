import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  alpha,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  ReadMore as ReadMoreIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return '#4caf50';
    case 'draft':
      return '#ff9800';
    case 'review':
      return '#37ABBF';
    case 'expired':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
};

const DataPolicyCard = ({ policy, currentTheme, sx: sxProp }) => {
  const navigate = useNavigate();
  const statusColor = getStatusColor(policy.status);
  const tags = Array.isArray(policy.tags) ? policy.tags : [];

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: '320px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        '&:hover .action-buttons': {
          opacity: 1,
        },
        ...sxProp,
      }}
    >
      <Box
        className="action-buttons"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 0.5,
          opacity: 0,
          transition: 'opacity 0.2s ease-in-out',
        }}
      >
        <Tooltip title="Edit standard">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/standards/edit/${policy.uuid || policy.id}`);
            }}
            sx={{
              bgcolor: alpha(currentTheme.primary, 0.1),
              color: currentTheme.primary,
              '&:hover': {
                bgcolor: currentTheme.primary,
                color: 'white',
              },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 3, pr: 6 }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              color: currentTheme.text,
              fontWeight: 600,
              mb: 2,
              lineHeight: 1.3,
              pr: 1,
            }}
          >
            {policy.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: currentTheme.textSecondary,
              mb: 3,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 'unset',
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
          >
            {policy.description}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <GroupsIcon sx={{ fontSize: 16, color: currentTheme.textSecondary }} />
          <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
            {Array.isArray(policy.owner) ? policy.owner.join(', ') : policy.owner || 'No team assigned'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {tags.slice(0, 3).map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              variant="outlined"
              sx={{
                borderColor: currentTheme.border,
                color: currentTheme.textSecondary,
                fontSize: '0.7rem',
              }}
            />
          ))}
          {tags.length > 3 && (
            <Chip
              label={`+${tags.length - 3}`}
              size="small"
              variant="outlined"
              sx={{
                borderColor: currentTheme.border,
                color: currentTheme.textSecondary,
                fontSize: '0.7rem',
              }}
            />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ p: 3, pt: 1, justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip
          label={policy.status}
          size="small"
          sx={{
            bgcolor: alpha(statusColor, 0.1),
            color: statusColor,
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        />
        <Button
          size="small"
          startIcon={<ReadMoreIcon />}
          onClick={(e) => {
            e.stopPropagation();
            const externalLink =
              policy.externalLink || policy.documentation || `https://company.com/policies/${policy.id}`;
            window.open(externalLink, '_blank', 'noopener,noreferrer');
          }}
          sx={{
            color: currentTheme.textSecondary,
            '&:hover': {
              bgcolor: alpha(currentTheme.textSecondary, 0.1),
            },
          }}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default DataPolicyCard;
