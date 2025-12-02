const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/energy/consumption/:householdId
router.get('/consumption/:householdId', async (req, res) => {
  try {
    const { householdId } = req.params;
    const { hours = 24 } = req.query;

    const query = `
      SELECT 
        time_bucket('1 hour', timestamp) AS hour,
        appliance_type,
        AVG(energy_kwh) as avg_energy_kwh,
        AVG(cost_usd) as avg_cost_usd,
        usage_label
      FROM energy_consumption
      WHERE household_id = $1
        AND timestamp >= (SELECT MAX(timestamp) - INTERVAL '${hours} hours' FROM energy_consumption WHERE household_id = $1)
      GROUP BY hour, appliance_type, usage_label
      ORDER BY hour DESC
    `;

    const result = await pool.query(query, [householdId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching consumption data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/energy/peak-hours/:householdId
router.get('/peak-hours/:householdId', async (req, res) => {
  try {
    const { householdId } = req.params;

    const query = `
      SELECT 
        usage_label,
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as frequency,
        AVG(energy_kwh) as avg_energy_kwh
      FROM energy_consumption
      WHERE household_id = $1
        AND usage_label IN ('Peak', 'Normal', 'Off-Peak')
      GROUP BY usage_label, hour
      ORDER BY usage_label, hour
    `;

    const result = await pool.query(query, [householdId]);

    // Organize by usage label
    const organized = {
      peak: [],
      normal: [],
      offPeak: []
    };

    result.rows.forEach(row => {
      const data = {
        hour: parseInt(row.hour),
        frequency: parseInt(row.frequency),
        avgEnergy: parseFloat(row.avg_energy_kwh)
      };

      if (row.usage_label === 'Peak') organized.peak.push(data);
      else if (row.usage_label === 'Normal') organized.normal.push(data);
      else if (row.usage_label === 'Off-Peak') organized.offPeak.push(data);
    });

    res.json(organized);
  } catch (error) {
    console.error('Error fetching peak hours:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/energy/cost-breakdown/:householdId
router.get('/cost-breakdown/:householdId', async (req, res) => {
  try {
    const { householdId } = req.params;
    const { days = 30 } = req.query;

    const query = `
      SELECT 
        appliance_type,
        SUM(energy_kwh) as total_kwh,
        SUM(cost_usd) as total_cost,
        AVG(energy_kwh) as avg_kwh,
        COUNT(*) as usage_count
      FROM energy_consumption
      WHERE household_id = $1
        AND timestamp >= (SELECT MAX(timestamp) - INTERVAL '${days} days' FROM energy_consumption WHERE household_id = $1)
      GROUP BY appliance_type
      ORDER BY total_cost DESC
    `;

    const result = await pool.query(query, [householdId]);

    const totalCost = result.rows.reduce((sum, row) => sum + parseFloat(row.total_cost), 0);

    const breakdown = result.rows.map(row => ({
      appliance: row.appliance_type,
      totalKwh: parseFloat(row.total_kwh).toFixed(2),
      totalCost: parseFloat(row.total_cost).toFixed(2),
      avgKwh: parseFloat(row.avg_kwh).toFixed(2),
      percentage: ((parseFloat(row.total_cost) / totalCost) * 100).toFixed(1),
      usageCount: parseInt(row.usage_count)
    }));

    res.json({
      totalCost: totalCost.toFixed(2),
      costPerKwh: 0.12,
      breakdown
    });
  } catch (error) {
    console.error('Error fetching cost breakdown:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
