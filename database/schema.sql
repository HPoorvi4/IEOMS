-- ====================================
-- IEOMS Database Schema
-- ====================================

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ====================================
-- 1. Households Table
-- ====================================
CREATE TABLE IF NOT EXISTS households (
    household_id SERIAL PRIMARY KEY,
    household_size INTEGER NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- 2. Energy Consumption Table (TimescaleDB Hypertable)
-- ====================================
CREATE TABLE IF NOT EXISTS energy_consumption (
    id SERIAL,
    household_id INTEGER NOT NULL REFERENCES households(household_id),
    timestamp TIMESTAMP NOT NULL,
    appliance_type VARCHAR(50) NOT NULL,
    energy_kwh DECIMAL(10, 4) NOT NULL,
    outdoor_temp DECIMAL(5, 2),
    season VARCHAR(20),
    cost_usd DECIMAL(10, 2),
    usage_label VARCHAR(20),
    PRIMARY KEY (id, timestamp)
);

-- Convert to hypertable (chunk by 1 day)
SELECT create_hypertable('energy_consumption', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Enable compression
ALTER TABLE energy_consumption SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'household_id, appliance_type'
);

-- Add compression policy (compress data older than 7 days)
SELECT add_compression_policy('energy_consumption', INTERVAL '7 days');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_household_timestamp 
    ON energy_consumption (household_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_appliance_type 
    ON energy_consumption (appliance_type);
CREATE INDEX IF NOT EXISTS idx_usage_label 
    ON energy_consumption (usage_label);

-- ====================================
-- 3. Usage Patterns Table
-- ====================================
CREATE TABLE IF NOT EXISTS usage_patterns (
    id SERIAL PRIMARY KEY,
    household_id INTEGER NOT NULL REFERENCES households(household_id),
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
    cluster_label VARCHAR(20) NOT NULL,
    avg_energy_kwh DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_household 
    ON usage_patterns (household_id);

-- ====================================
-- 4. Energy Forecasts Table
-- ====================================
CREATE TABLE IF NOT EXISTS energy_forecasts (
    id SERIAL PRIMARY KEY,
    household_id INTEGER NOT NULL REFERENCES households(household_id),
    forecast_timestamp TIMESTAMP NOT NULL,
    appliance_type VARCHAR(50) NOT NULL,
    predicted_energy_kwh DECIMAL(10, 4) NOT NULL,
    confidence_score DECIMAL(5, 4),
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecast_household_time 
    ON energy_forecasts (household_id, forecast_timestamp DESC);

-- ====================================
-- 5. Recommendations Table
-- ====================================
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    household_id INTEGER NOT NULL REFERENCES households(household_id),
    recommendation_text TEXT NOT NULL,
    potential_savings_kwh DECIMAL(10, 4),
    potential_savings_usd DECIMAL(10, 2),
    priority VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_household 
    ON recommendations (household_id);

-- ====================================
-- Seed Data: Insert Default Household
-- ====================================
INSERT INTO households (household_id, household_size, location) 
VALUES (1, 4, 'Demo Location')
ON CONFLICT (household_id) DO NOTHING;

-- ====================================
-- Useful TimescaleDB Queries
-- ====================================

-- Hourly aggregation query
-- SELECT 
--   time_bucket('1 hour', timestamp) AS hour,
--   AVG(energy_kwh) as avg_consumption,
--   usage_label
-- FROM energy_consumption
-- WHERE household_id = 1
--   AND timestamp >= NOW() - INTERVAL '24 hours'
-- GROUP BY hour, usage_label
-- ORDER BY hour;

-- Daily trends query
-- SELECT 
--   time_bucket('1 day', timestamp) AS day,
--   SUM(energy_kwh) as total_kwh,
--   SUM(cost_usd) as total_cost
-- FROM energy_consumption
-- WHERE household_id = 1
--   AND timestamp >= NOW() - INTERVAL '30 days'
-- GROUP BY day;
