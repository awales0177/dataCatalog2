import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Cloud as CloudIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Storage as StorageIcon,
  TableChart as TableChartIcon,
  Api as ApiIcon,
  Hub as HubIcon,
  Dns as DnsIcon,
  CloudQueue as CloudQueueIcon,
  Link as LinkIcon
} from '@mui/icons-material';

const DATA_SOURCES = [
  { 
    value: 'hive', 
    label: 'Hive Catalog', 
    icon: <TableChartIcon sx={{ fontSize: 32 }} />,
    color: '#FF6B35'
  },
  { 
    value: 'trino', 
    label: 'Trino', 
    icon: <HubIcon sx={{ fontSize: 32 }} />,
    color: '#00A8E8'
  },
  { 
    value: 'clickhouse', 
    label: 'ClickHouse', 
    icon: <DnsIcon sx={{ fontSize: 32 }} />,
    color: '#FFCC02'
  },
  { 
    value: 'athena', 
    label: 'Athena', 
    icon: <CloudQueueIcon sx={{ fontSize: 32 }} />,
    color: '#FF9900'
  },
  { 
    value: 'databricks', 
    label: 'Databricks', 
    icon: <CloudIcon sx={{ fontSize: 32 }} />,
    color: '#FF3621'
  },
  { 
    value: 'dynamodb', 
    label: 'DynamoDB', 
    icon: <DnsIcon sx={{ fontSize: 32 }} />,
    color: '#4053D6'
  },
  { 
    value: 'iceberg', 
    label: 'Iceberg', 
    icon: <StorageIcon sx={{ fontSize: 32 }} />,
    color: '#00D4FF'
  },
  { 
    value: 'kafka', 
    label: 'Kafka', 
    icon: <ApiIcon sx={{ fontSize: 32 }} />,
    color: '#231F20'
  },
  { 
    value: 'mysql', 
    label: 'MySQL', 
    icon: <DnsIcon sx={{ fontSize: 32 }} />,
    color: '#00758F'
  },
  { 
    value: 'neo4j', 
    label: 'Neo4j', 
    icon: <HubIcon sx={{ fontSize: 32 }} />,
    color: '#008CC1'
  },
  { 
    value: 'snowflake', 
    label: 'Snowflake', 
    icon: <CloudQueueIcon sx={{ fontSize: 32 }} />,
    color: '#29B5E8'
  },
  { 
    value: 'other', 
    label: 'Other', 
    icon: <LinkIcon sx={{ fontSize: 32 }} />,
    color: '#9E9E9E'
  }
];

const DataSourceConnection = ({ currentTheme, onConnect }) => {
  const [open, setOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState('');
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [connectionName, setConnectionName] = useState('');
  const [connectionConfig, setConnectionConfig] = useState({
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    additionalParams: ''
  });
  const [errors, setErrors] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setSelectedSource('');
    setShowConnectionForm(false);
    setConnectionName('');
    setConnectionConfig({
      host: '',
      port: '',
      database: '',
      username: '',
      password: '',
      additionalParams: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSource('');
    setShowConnectionForm(false);
    setConnectionName('');
    setConnectionConfig({
      host: '',
      port: '',
      database: '',
      username: '',
      password: '',
      additionalParams: ''
    });
    setErrors({});
  };

  const handleSourceSelect = (sourceValue) => {
    setSelectedSource(sourceValue);
    setShowConnectionForm(true);
    setErrors({});
  };

  const handleBackToSelection = () => {
    setShowConnectionForm(false);
    setSelectedSource('');
    setConnectionName('');
    setConnectionConfig({
      host: '',
      port: '',
      database: '',
      username: '',
      password: '',
      additionalParams: ''
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedSource) {
      newErrors.source = 'Please select a data source';
    }
    
    if (!connectionName.trim()) {
      newErrors.name = 'Connection name is required';
    }
    
    if (selectedSource && selectedSource !== 'other') {
      if (!connectionConfig.host.trim()) {
        newErrors.host = 'Host is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConnect = async () => {
    if (!validateForm()) {
      return;
    }

    setIsConnecting(true);
    
    try {
      const connectionData = {
        source: selectedSource,
        name: connectionName,
        config: connectionConfig,
        timestamp: new Date().toISOString()
      };

      // Call the onConnect callback if provided
      if (onConnect) {
        await onConnect(connectionData);
      }

      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1500));

      handleClose();
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const getSourceInfo = (sourceValue) => {
    const source = DATA_SOURCES.find(s => s.value === sourceValue);
    return source || { label: 'Unknown', icon: <LinkIcon />, color: '#9E9E9E' };
  };

  const renderConnectionFields = () => {
    if (!selectedSource || selectedSource === 'other') {
      return (
        <TextField
          fullWidth
          label="Connection Details"
          placeholder="Enter connection details or configuration"
          multiline
          rows={4}
          value={connectionConfig.additionalParams}
          onChange={(e) => setConnectionConfig(prev => ({ ...prev, additionalParams: e.target.value }))}
          sx={{
            mt: 2,
            '& .MuiOutlinedInput-root': {
              bgcolor: currentTheme.card,
              '& fieldset': {
                borderColor: currentTheme.border,
              },
            },
            '& .MuiInputBase-input': {
              color: currentTheme.text,
            },
          }}
        />
      );
    }

    return (
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          label="Host"
          placeholder="e.g., localhost, example.com"
          value={connectionConfig.host}
          onChange={(e) => setConnectionConfig(prev => ({ ...prev, host: e.target.value }))}
          error={!!errors.host}
          helperText={errors.host}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: currentTheme.card,
              '& fieldset': {
                borderColor: currentTheme.border,
              },
            },
            '& .MuiInputBase-input': {
              color: currentTheme.text,
            },
          }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Port"
            placeholder="e.g., 3306, 5432"
            type="number"
            value={connectionConfig.port}
            onChange={(e) => setConnectionConfig(prev => ({ ...prev, port: e.target.value }))}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: currentTheme.card,
                '& fieldset': {
                  borderColor: currentTheme.border,
                },
              },
              '& .MuiInputBase-input': {
                color: currentTheme.text,
              },
            }}
          />
          <TextField
            fullWidth
            label="Database"
            placeholder="Database name"
            value={connectionConfig.database}
            onChange={(e) => setConnectionConfig(prev => ({ ...prev, database: e.target.value }))}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: currentTheme.card,
                '& fieldset': {
                  borderColor: currentTheme.border,
                },
              },
              '& .MuiInputBase-input': {
                color: currentTheme.text,
              },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Username"
            value={connectionConfig.username}
            onChange={(e) => setConnectionConfig(prev => ({ ...prev, username: e.target.value }))}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: currentTheme.card,
                '& fieldset': {
                  borderColor: currentTheme.border,
                },
              },
              '& .MuiInputBase-input': {
                color: currentTheme.text,
              },
            }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={connectionConfig.password}
            onChange={(e) => setConnectionConfig(prev => ({ ...prev, password: e.target.value }))}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: currentTheme.card,
                '& fieldset': {
                  borderColor: currentTheme.border,
                },
              },
              '& .MuiInputBase-input': {
                color: currentTheme.text,
              },
            }}
          />
        </Box>
        <TextField
          fullWidth
          label="Additional Parameters (Optional)"
          placeholder="e.g., ssl=true, timeout=30"
          multiline
          rows={2}
          value={connectionConfig.additionalParams}
          onChange={(e) => setConnectionConfig(prev => ({ ...prev, additionalParams: e.target.value }))}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: currentTheme.card,
              '& fieldset': {
                borderColor: currentTheme.border,
              },
            },
            '& .MuiInputBase-input': {
              color: currentTheme.text,
            },
          }}
        />
      </Box>
    );
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleOpen}
        sx={{
          bgcolor: currentTheme.primary,
          color: '#fff',
          textTransform: 'none',
          fontWeight: 600,
          px: 3,
          py: 1.5,
          borderRadius: 2,
          boxShadow: `0 2px 8px ${currentTheme.primary}30`,
          '&:hover': {
            bgcolor: currentTheme.primary,
            boxShadow: `0 4px 12px ${currentTheme.primary}40`,
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease',
        }}
      >
        Connect Data Source
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            borderBottom: `1px solid ${currentTheme.border}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CloudIcon sx={{ color: currentTheme.primary, fontSize: '1.5rem' }} />
            <Typography variant="h6" sx={{ color: currentTheme.text, fontWeight: 600 }}>
              Connect Data Source
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{
              color: currentTheme.textSecondary,
              '&:hover': {
                bgcolor: `${currentTheme.primary}10`,
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          {!showConnectionForm ? (
            // Source Selection Grid
            <Box>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
                Select a data source to connect
              </Typography>
              <Grid container spacing={2}>
                {DATA_SOURCES.map((source) => (
                  <Grid item xs={6} sm={4} md={3} key={source.value}>
                    <Card
                      onClick={() => handleSourceSelect(source.value)}
                      elevation={0}
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        bgcolor: currentTheme.background,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: `${source.color}08`,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardContent
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          p: 3,
                          gap: 1.5,
                          minHeight: 140,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: `${source.color}15`,
                            color: source.color,
                            mb: 1,
                          }}
                        >
                          {source.icon}
                        </Avatar>
                        <Typography
                          variant="body1"
                          sx={{
                            color: currentTheme.text,
                            fontWeight: 600,
                            textAlign: 'center',
                            fontSize: '0.9rem',
                          }}
                        >
                          {source.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            // Connection Form
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Selected Source Header */}
              {selectedSource && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: `${getSourceInfo(selectedSource).color}10`,
                    border: `1px solid ${getSourceInfo(selectedSource).color}30`,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: `${getSourceInfo(selectedSource).color}15`,
                      color: getSourceInfo(selectedSource).color,
                    }}
                  >
                    {getSourceInfo(selectedSource).icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                      {getSourceInfo(selectedSource).label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      Configure your connection details
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={handleBackToSelection}
                    sx={{
                      color: currentTheme.textSecondary,
                      '&:hover': {
                        bgcolor: `${currentTheme.primary}10`,
                      },
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </Box>
              )}

              {/* Connection Name */}
              <TextField
                fullWidth
                label="Connection Name"
                placeholder="e.g., Production MySQL, Snowflake Analytics"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name || 'Give this connection a descriptive name'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: currentTheme.background,
                    '& fieldset': {
                      borderColor: currentTheme.border,
                    },
                    '&:hover fieldset': {
                      borderColor: currentTheme.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: currentTheme.primary,
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: currentTheme.text,
                  },
                  '& .MuiInputLabel-root': {
                    color: currentTheme.textSecondary,
                  },
                }}
              />

              {errors.source && (
                <Alert severity="error" sx={{ bgcolor: `${currentTheme.error}15`, color: currentTheme.error }}>
                  {errors.source}
                </Alert>
              )}

              {/* Connection Configuration */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SettingsIcon sx={{ color: currentTheme.primary, fontSize: '1.2rem' }} />
                  <Typography variant="subtitle1" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                    Connection Configuration
                  </Typography>
                </Box>
                {renderConnectionFields()}
              </Box>
            </Box>
          )}
        </DialogContent>

        {showConnectionForm && (
          <DialogActions
            sx={{
              px: 3,
              py: 2,
              borderTop: `1px solid ${currentTheme.border}`,
              gap: 1,
            }}
          >
            <Button
              onClick={handleClose}
              sx={{
                color: currentTheme.textSecondary,
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              variant="contained"
              disabled={isConnecting}
              startIcon={isConnecting ? <CircularProgress size={16} /> : <CheckCircleIcon />}
              sx={{
                bgcolor: currentTheme.primary,
                color: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  bgcolor: currentTheme.primary,
                },
                '&:disabled': {
                  bgcolor: `${currentTheme.primary}50`,
                },
              }}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};

export default DataSourceConnection;

