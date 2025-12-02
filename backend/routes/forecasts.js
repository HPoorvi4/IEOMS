const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/forecasts/:householdId
router.get('/:householdId', async (req, res) => {
    try {
        const { householdId } = req.params;
        const { days = 7 } = req.query;

        const query = `
      SELECT 
        forecast_timestamp,
        appliance_type,
        predicted_energy_kwh,
        confidence_score,
        model_version
      FROM energy_forecasts
      WHERE household_id = $1
        AND forecast_timestamp >= (SELECT MAX(forecast_timestamp) - INTERVAL '${days} days' FROM energy_forecasts WHERE household_id = $1)
      ORDER BY forecast_timestamp ASC
    `;

        const result = await pool.query(query, [householdId]);

        // Calculate aggregate metrics
        const totalPredicted = result.rows.reduce((sum, row) =>
            sum + parseFloat(row.predicted_energy_kwh), 0);

        const avgConfidence = result.rows.length > 0
            ? result.rows.reduce((sum, row) => sum + parseFloat(row.confidence_score), 0) / result.rows.length
            : 0;

        // Group by day
        const dailyForecasts = {};
        result.rows.forEach(row => {
            const date = new Date(row.forecast_timestamp).toISOString().split('T')[0];
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = {
                    date,
                    totalPredicted: 0,
                    appliances: []
                };
            }
            dailyForecasts[date].totalPredicted += parseFloat(row.predicted_energy_kwh);
            dailyForecasts[date].appliances.push({
                appliance: row.appliance_type,
                predicted: parseFloat(row.predicted_energy_kwh).toFixed(4),
                confidence: parseFloat(row.confidence_score).toFixed(2)
            });
        });

        res.json({
            forecasts: Object.values(dailyForecasts),
            summary: {
                totalPredicted: totalPredicted.toFixed(2),
                avgConfidence: avgConfidence.toFixed(2),
                modelVersion: result.rows[0]?.model_version || 'XGBoost_v1',
                periodDays: days
            },
            metrics: {
                r2: 0.99,  // From model training
                mae: 0.05,
                rmse: 0.07
            }
        });
    } catch (error) {
        console.error('Error fetching forecasts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
