const express = require('express');
const cors = require('cors');
const energyRoutes = require('./routes/energy');
const forecastsRoutes = require('./routes/forecasts');
const recommendationsRoutes = require('./routes/recommendations');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'IEOMS Backend API is running' });
});

// Routes
app.use('/api/energy', energyRoutes);
app.use('/api/forecasts', forecastsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 IEOMS Backend API running on http://localhost:${PORT}`);
});
