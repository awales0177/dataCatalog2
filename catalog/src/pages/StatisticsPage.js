import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchStatistics, trackPageView } from '../services/api';

const StatisticsPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const data = await fetchStatistics();
        setStatistics(data);
        setError(null);
      } catch (err) {
        setError('Failed to load statistics');
        console.error('Error loading statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  // Transform data for charts
  const getDailyDataByPage = () => {
    if (!statistics || !statistics.pageViews) return [];

    const pageNames = Object.keys(statistics.pageViews);
    const allDates = new Set();
    
    // Collect all dates
    pageNames.forEach(page => {
      const daily = statistics.pageViews[page].daily || {};
      Object.keys(daily).forEach(date => allDates.add(date));
    });

    // Sort dates
    const sortedDates = Array.from(allDates).sort();

    // Create data structure for chart
    return sortedDates.map(date => {
      const dataPoint = { date };
      pageNames.forEach(page => {
        const daily = statistics.pageViews[page].daily || {};
        dataPoint[page] = daily[date] || 0;
      });
      return dataPoint;
    });
  };

  const getTotalViewsByPage = () => {
    if (!statistics || !statistics.pageViews) return [];

    return Object.keys(statistics.pageViews).map(page => ({
      page,
      views: statistics.pageViews[page].total || 0
    })).sort((a, b) => b.views - a.views);
  };

  const getRecentDaysData = (days = 30) => {
    const allData = getDailyDataByPage();
    return allData.slice(-days);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: currentTheme.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          {error}
        </Alert>
      </Box>
    );
  }

  const dailyData = getDailyDataByPage();
  const totalByPage = getTotalViewsByPage();
  const recentData = getRecentDaysData(30);
  const totalSiteVisits = statistics?.siteVisits?.total || 0;

  // Get page colors for charts
  const pageColors = [
    currentTheme.primary,
    '#FF9800',
    '#4CAF50',
    '#2196F3',
    '#9C27B0',
    '#F44336',
    '#00BCD4',
    '#FFC107',
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
        Statistics
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        View page analytics and usage statistics
      </Typography>

      {/* Total Site Visits Card */}
      <Card 
        elevation={0}
        sx={{ 
          mb: 4, 
          bgcolor: currentTheme.card, 
          border: `1px solid ${currentTheme.border}`,
          '&:hover': {
            transform: 'none',
            boxShadow: 'none',
            elevation: 0
          }
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text }}>
            All-Time Total Site Visits
          </Typography>
          <Typography variant="h3" sx={{ color: currentTheme.primary, fontWeight: 600 }}>
            {totalSiteVisits.toLocaleString()}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Total Views by Page - Bar Chart */}
        <Grid item xs={12} lg={6}>
          <Card 
            elevation={0}
            sx={{ 
              bgcolor: currentTheme.card, 
              border: `1px solid ${currentTheme.border}`, 
              height: '100%',
              '&:hover': {
                transform: 'none',
                boxShadow: 'none',
                elevation: 0
              }
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text }}>
                Total Views by Page
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={totalByPage}>
                  <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} />
                  <XAxis 
                    dataKey="page" 
                    stroke={currentTheme.textSecondary}
                    tick={{ fill: currentTheme.textSecondary }}
                  />
                  <YAxis 
                    stroke={currentTheme.textSecondary}
                    tick={{ fill: currentTheme.textSecondary }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: currentTheme.card,
                      border: `1px solid ${currentTheme.border}`,
                      color: currentTheme.text
                    }}
                  />
                  <Bar dataKey="views" fill={currentTheme.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Views Over Time - Line Chart (Last 30 Days) */}
        <Grid item xs={12} lg={6}>
          <Card 
            elevation={0}
            sx={{ 
              bgcolor: currentTheme.card, 
              border: `1px solid ${currentTheme.border}`, 
              height: '100%',
              '&:hover': {
                transform: 'none',
                boxShadow: 'none',
                elevation: 0
              }
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text }}>
                Daily Views (Last 30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={recentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} />
                  <XAxis 
                    dataKey="date" 
                    stroke={currentTheme.textSecondary}
                    tick={{ fill: currentTheme.textSecondary, fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke={currentTheme.textSecondary}
                    tick={{ fill: currentTheme.textSecondary }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: currentTheme.card,
                      border: `1px solid ${currentTheme.border}`,
                      color: currentTheme.text
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: currentTheme.text }}
                  />
                  {Object.keys(statistics?.pageViews || {}).slice(0, 5).map((page, index) => (
                    <Line
                      key={page}
                      type="monotone"
                      dataKey={page}
                      stroke={pageColors[index % pageColors.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* All Daily Views - Line Chart */}
        <Grid item xs={12}>
          <Card 
            elevation={0}
            sx={{ 
              bgcolor: currentTheme.card, 
              border: `1px solid ${currentTheme.border}`,
              '&:hover': {
                transform: 'none',
                boxShadow: 'none',
                elevation: 0
              }
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text }}>
                Daily Views by Page (All Time)
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} />
                  <XAxis 
                    dataKey="date" 
                    stroke={currentTheme.textSecondary}
                    tick={{ fill: currentTheme.textSecondary, fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke={currentTheme.textSecondary}
                    tick={{ fill: currentTheme.textSecondary }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: currentTheme.card,
                      border: `1px solid ${currentTheme.border}`,
                      color: currentTheme.text
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: currentTheme.text }}
                  />
                  {Object.keys(statistics?.pageViews || {}).map((page, index) => (
                    <Line
                      key={page}
                      type="monotone"
                      dataKey={page}
                      stroke={pageColors[index % pageColors.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StatisticsPage;

