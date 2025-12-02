const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { getGeminiRecommendations } = require('../controllers/geminiController');

// GET /api/recommendations/:householdId
router.get('/:householdId', async (req, res) => {
  try {
    const { householdId } = req.params;

    // Gather energy data for recommendations
    const consumptionQuery = `
      SELECT 
        appliance_type,
        usage_label,
        AVG(energy_kwh) as avg_kwh,
        SUM(cost_usd) as total_cost
      FROM energy_consumption
      WHERE household_id = $1
        AND timestamp >= (SELECT MAX(timestamp) - INTERVAL '7 days' FROM energy_consumption WHERE household_id = $1)
      GROUP BY appliance_type, usage_label
      ORDER BY total_cost DESC
    `;

    const peakQuery = `
      SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        AVG(energy_kwh) as avg_kwh
      FROM energy_consumption
      WHERE household_id = $1
        AND usage_label = 'Peak'
        AND timestamp >= (SELECT MAX(timestamp) - INTERVAL '7 days' FROM energy_consumption WHERE household_id = $1)
      GROUP BY hour
      ORDER BY avg_kwh DESC
      LIMIT 5
    `;

    const [consumptionResult, peakResult] = await Promise.all([
      pool.query(consumptionQuery, [householdId]),
      pool.query(peakQuery, [householdId])
    ]);

    const energyData = {
      householdId,
      consumption: consumptionResult.rows.map(row => ({
        appliance: row.appliance_type,
        usageLabel: row.usage_label,
        avgKwh: parseFloat(row.avg_kwh).toFixed(2),
        totalCost: parseFloat(row.total_cost).toFixed(2)
      })),
      peakHours: peakResult.rows.map(row => ({
        hour: parseInt(row.hour),
        avgKwh: parseFloat(row.avg_kwh).toFixed(2)
      })),
      period: 'last 7 days'
    };

    // Get AI recommendations from Gemini
    const recommendations = await getGeminiRecommendations(energyData);

    // Store recommendations in database
    const insertQuery = `
      INSERT INTO recommendations 
      (household_id, recommendation_text, potential_savings_kwh, potential_savings_usd, priority)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const storedRecommendations = [];
    for (const rec of recommendations) {
      const result = await pool.query(insertQuery, [
        householdId,
        rec.action,
        rec.savings_kwh || 0,
        rec.savings_usd || 0,
        rec.priority || 'medium'
      ]);

      storedRecommendations.push({
        id: result.rows[0].id,
        ...rec
      });
    }

    res.json({
      recommendations: storedRecommendations,
      energyContext: energyData
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;
