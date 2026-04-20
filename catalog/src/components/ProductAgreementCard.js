import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  alpha,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/themeUtils';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import FactoryIcon from '@mui/icons-material/Factory';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import { getProducerTeamImageSrc } from '../utils/producerTeamImage';

const ProductAgreementCard = ({ agreement, currentTheme, applications = [] }) => {
  const navigate = useNavigate();
  const dark = Boolean(currentTheme?.darkMode);
  const primary = currentTheme.primary;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'in_progress':
        return '#37ABBF';
      case 'in_review':
        return '#ff9800';
      case 'expired':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const statusColor = getStatusColor(agreement.status);
  const producerTeamImageSrc = getProducerTeamImageSrc(agreement, applications);

  const getOwnerRole = () => {
    const owner = agreement.owner;
    const producers = agreement.dataProducer || [];
    const consumers = agreement.dataConsumer || [];

    if (!owner || owner.length === 0) return null;

    const ownerArray = Array.isArray(owner) ? owner : [owner];
    const producerArray = Array.isArray(producers) ? producers : [producers];
    const consumerArray = Array.isArray(consumers) ? consumers : [consumers];

    const isProducer = ownerArray.some((ownerName) =>
      producerArray.some(
        (producer) => producer && producer.toLowerCase() === ownerName.toLowerCase(),
      ),
    );

    const isConsumer = ownerArray.some((ownerName) =>
      consumerArray.some(
        (consumer) => consumer && consumer.toLowerCase() === ownerName.toLowerCase(),
      ),
    );

    if (isProducer && isConsumer) return 'both';
    if (isProducer) return 'producer';
    if (isConsumer) return 'consumer';
    return null;
  };

  const ownerRole = getOwnerRole();

  const partyChipSx = {
    borderColor: alpha(primary, 0.35),
    color: currentTheme.text,
    bgcolor: alpha(primary, dark ? 0.06 : 0.04),
    fontWeight: 600,
    fontSize: '0.7rem',
    height: 26,
    '& .MuiChip-icon': {
      color: alpha(primary, 0.85),
      fontSize: 16,
    },
  };

  const renderRoleChips = () => {
    const producers = agreement.dataProducer || [];
    const consumers = agreement.dataConsumer || [];
    const owner = agreement.owner;

    if (!owner || !Array.isArray(owner)) return null;

    const producerArray = Array.isArray(producers) ? producers : [producers];
    const consumerArray = Array.isArray(consumers) ? consumers : [consumers];

    const validProducers = producerArray.filter((p) => p && p.trim());
    const validConsumers = consumerArray.filter((c) => c && c.trim());

    if (ownerRole === 'producer' && validConsumers.length > 0) {
      return validConsumers.slice(0, 3).map((consumer, index) => (
        <Chip
          key={`consumer-${index}`}
          icon={<ShoppingBasketIcon sx={{ fontSize: 14 }} />}
          label={consumer}
          size="small"
          variant="outlined"
          sx={partyChipSx}
        />
      ));
    }
    if (ownerRole === 'consumer' && validProducers.length > 0) {
      return validProducers.slice(0, 3).map((producer, index) => (
        <Chip
          key={`producer-${index}`}
          icon={<FactoryIcon sx={{ fontSize: 14 }} />}
          label={producer}
          size="small"
          variant="outlined"
          sx={partyChipSx}
        />
      ));
    }
    if (ownerRole === 'both') {
      const allParties = [...validProducers, ...validConsumers].slice(0, 3);
      return allParties.map((party, index) => {
        const isProducer = validProducers.includes(party);
        return (
          <Chip
            key={`party-${index}`}
            icon={
              isProducer ? (
                <FactoryIcon sx={{ fontSize: 14 }} />
              ) : (
                <ShoppingBasketIcon sx={{ fontSize: 14 }} />
              )
            }
            label={party}
            size="small"
            variant="outlined"
            sx={partyChipSx}
          />
        );
      });
    }

    return null;
  };

  const roleChips = renderRoleChips();

  const handleClick = () => {
    navigate(`/agreements/${encodeURIComponent(agreement.uuid || agreement.id)}`);
  };

  const statusLabel = (agreement.status || 'unknown')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <Card
      onClick={handleClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        overflow: 'hidden',
        borderRadius: 3,
        border: `1px solid ${currentTheme.border}`,
        bgcolor: currentTheme.card,
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          p: 2.5,
          '&:last-child': { pb: 2.5 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            mb: 2,
          }}
        >
          {producerTeamImageSrc ? (
            <Box
              component="img"
              src={producerTeamImageSrc}
              alt=""
              sx={{
                width: 56,
                height: 56,
                objectFit: 'cover',
                borderRadius: '50%',
                flexShrink: 0,
                border: `2px solid ${alpha(primary, dark ? 0.35 : 0.28)}`,
                boxShadow: `0 4px 14px ${alpha(primary, dark ? 0.2 : 0.12)}`,
                bgcolor: alpha(currentTheme.text, 0.04),
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(primary, dark ? 0.14 : 0.1),
                border: `1px dashed ${alpha(primary, 0.4)}`,
                color: alpha(primary, 0.85),
              }}
              aria-hidden
            >
              <HandshakeOutlinedIcon sx={{ fontSize: 28 }} />
            </Box>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: currentTheme.textSecondary,
                letterSpacing: '0.06em',
                fontWeight: 700,
                fontSize: '0.65rem',
                lineHeight: 1.2,
                mb: 0.25,
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Product agreement
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: currentTheme.text,
                wordBreak: 'break-word',
                lineHeight: 1.25,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {agreement.name}
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: currentTheme.textSecondary,
            mb: 2,
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {agreement.description || 'No description available'}
        </Typography>

        {roleChips?.length ? (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>{roleChips}</Box>
        ) : null}

        <Box sx={{ flex: 1, minHeight: 8 }} />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            pt: 2,
            mt: 'auto',
          }}
        >
          <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
            {formatDate(agreement.lastUpdated)}
          </Typography>
          <Chip
            label={statusLabel}
            size="small"
            variant="outlined"
            sx={{
              borderColor: alpha(statusColor, 0.45),
              color: statusColor,
              bgcolor: alpha(statusColor, dark ? 0.08 : 0.06),
              fontWeight: 600,
              fontSize: '0.7rem',
              textTransform: 'capitalize',
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductAgreementCard;
