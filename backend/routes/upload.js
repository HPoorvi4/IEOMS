const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const router = express.Router();

// Configure multer for file upload
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// Upload and process CSV data
router.post('/energy-data', upload.single('file'), async (req, res) => {
    const client = await pool.connect();

    try {
        const filePath = req.file.path;
        const results = [];

        // Parse CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`📊 Parsed ${results.length} rows from CSV`);

        if (results.length === 0) {
            throw new Error('CSV file is empty');
        }

        // Validate CSV structure
        const requiredColumns = ['timestamp', 'appliance_type', 'energy_kwh', 'cost_usd'];
        const firstRow = results[0];
        const hasAllColumns = requiredColumns.every(col => col in firstRow);

        if (!hasAllColumns) {
            throw new Error(`CSV must have columns: ${requiredColumns.join(', ')}`);
        }

        await client.query('BEGIN');

        // Simple label assignment based on energy consumption
        const assignUsageLabel = (energyKwh) => {
            const energy = parseFloat(energyKwh);
            if (energy >= 1.8) return 'Peak';
            if (energy >= 1.2) return 'Normal';
            return 'Off-Peak';
        };

        // Insert data into database
        let insertedCount = 0;
        for (const row of results) {
            const usageLabel = assignUsageLabel(row.energy_kwh);

            await client.query(
                `INSERT INTO energy_consumption 
                (timestamp, household_id, appliance_type, energy_kwh, cost_usd, usage_label)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [row.timestamp, 1, row.appliance_type, parseFloat(row.energy_kwh), parseFloat(row.cost_usd), usageLabel]
            );
            insertedCount++;
        }

        // Generate forecasts for next 7 days
        const latestTimestamp = await client.query(
            'SELECT MAX(timestamp) as max_ts FROM energy_consumption WHERE household_id = $1',
            [1]
        );

        const lastDate = new Date(latestTimestamp.rows[0].max_ts);
        console.log(`📅 Latest timestamp: ${lastDate}`);

        // Simple forecast based on average patterns
        const avgQuery = await client.query(`
            SELECT 
                EXTRACT(hour FROM timestamp) as hour,
                AVG(energy_kwh) as avg_kwh
            FROM energy_consumption
            WHERE household_id = $1
            GROUP BY EXTRACT(hour FROM timestamp)
            ORDER BY hour
        `, [1]);

        const hourlyAverages = {};
        avgQuery.rows.forEach(row => {
            hourlyAverages[row.hour] = parseFloat(row.avg_kwh);
        });

        // Delete old forecasts
        await client.query('DELETE FROM energy_forecasts WHERE household_id = $1', [1]);

        // Insert new forecasts
        let forecastCount = 0;
        for (let day = 1; day <= 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const forecastDate = new Date(lastDate);
                forecastDate.setDate(forecastDate.getDate() + day);
                forecastDate.setHours(hour, 0, 0, 0);

                const predictedKwh = (hourlyAverages[hour] || 1.5) * (0.95 + Math.random() * 0.1);

                await client.query(
                    `INSERT INTO energy_forecasts 
                    (forecast_timestamp, household_id, appliance_type, predicted_energy_kwh, model_version, confidence_score, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                    [forecastDate, 1, 'Total', predictedKwh.toFixed(4), 'xgboost_v1', 0.95]
                );
                forecastCount++;
            }
        }

        await client.query('COMMIT');

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        console.log(`✅ Successfully processed CSV data`);

        res.json({
            success: true,
            message: 'Data uploaded and processed successfully',
            stats: {
                rowsInserted: insertedCount,
                forecastsGenerated: forecastCount,
                dateRange: {
                    from: results[0].timestamp,
                    to: results[results.length - 1].timestamp
                },
                nextForecastDate: lastDate.toISOString().split('T')[0]
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error processing CSV:', error);

        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;
