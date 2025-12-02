import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
import numpy as np

print("=" * 60)
print("📊 POPULATING DATABASE WITH PROCESSED DATA")
print("=" * 60)

# Database connection parameters
DB_CONFIG = {
    'dbname': 'IEOMS',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'localhost',
    'port': '5432'
}

# Load the processed data with predictions
print("\n📁 Loading processed data...")
df = pd.read_csv('models/data_with_predictions.csv')
print(f"✅ Loaded {len(df)} records")

# Connect to PostgreSQL
print("\n🔗 Connecting to PostgreSQL...")
conn = psycopg2.connect(**DB_CONFIG)
cursor = conn.cursor()
print("✅ Connected successfully")

# ============================================================
# 1. INSERT ENERGY CONSUMPTION DATA
# ============================================================
print("\n📥 Inserting energy consumption data...")

# Prepare data for insertion
energy_data = []
for idx, row in df.iterrows():
    # Calculate cost (assuming $0.12 per kWh as example rate)
    cost = float(row['Energy Consumption (kWh)']) * 0.12
    
    energy_data.append((
        1,  # household_id (using 1 for demo)
        row['datetime'],
        row['Appliance Type'],
        float(row['Energy Consumption (kWh)']),
        float(row['Outdoor Temperature (°C)']),
        row['Season'],
        cost,
        row['usage_label']
    ))

# Batch insert
insert_query = """
INSERT INTO energy_consumption 
(household_id, timestamp, appliance_type, energy_kwh, outdoor_temp, season, cost_usd, usage_label)
VALUES %s
ON CONFLICT DO NOTHING
"""

batch_size = 1000
total_batches = (len(energy_data) + batch_size - 1) // batch_size

for i in range(0, len(energy_data), batch_size):
    batch = energy_data[i:i+batch_size]
    execute_values(cursor, insert_query, batch)
    conn.commit()
    print(f"  Inserted batch {i//batch_size + 1}/{total_batches}")

print(f"✅ Inserted {len(energy_data)} energy consumption records")

# ============================================================
# 2. INSERT USAGE PATTERNS
# ============================================================
print("\n📥 Inserting usage patterns...")

# Aggregate hourly patterns by usage label
usage_patterns = df.groupby(['hour', 'weekday', 'usage_label']).agg({
    'Energy Consumption (kWh)': 'mean'
}).reset_index()

pattern_data = []
for idx, row in usage_patterns.iterrows():
    pattern_data.append((
        1,  # household_id
        int(row['hour']),
        int(row['weekday']),
        row['usage_label'],
        float(row['Energy Consumption (kWh)'])
    ))

pattern_query = """
INSERT INTO usage_patterns 
(household_id, hour, weekday, cluster_label, avg_energy_kwh)
VALUES %s
ON CONFLICT DO NOTHING
"""

execute_values(cursor, pattern_query, pattern_data)
conn.commit()
print(f"✅ Inserted {len(pattern_data)} usage pattern records")

# ============================================================
# 3. INSERT ENERGY FORECASTS
# ============================================================
print("\n📥 Inserting energy forecasts...")

# Use the predictions from the model
forecast_data = []
for idx, row in df.iterrows():
    forecast_data.append((
        1,  # household_id
        row['datetime'],
        row['Appliance Type'],
        float(row['predicted_energy_kwh']),
        0.99,  # confidence_score (model has 99% accuracy)
        'XGBoost_v1'
    ))

forecast_query = """
INSERT INTO energy_forecasts 
(household_id, forecast_timestamp, appliance_type, predicted_energy_kwh, confidence_score, model_version)
VALUES %s
ON CONFLICT DO NOTHING
"""

for i in range(0, len(forecast_data), batch_size):
    batch = forecast_data[i:i+batch_size]
    execute_values(cursor, forecast_query, batch)
    conn.commit()
    print(f"  Inserted batch {i//batch_size + 1}/{total_batches}")

print(f"✅ Inserted {len(forecast_data)} forecast records")

# ============================================================
# 4. VERIFY DATA
# ============================================================
print("\n🔍 Verifying data insertion...")

cursor.execute("SELECT COUNT(*) FROM energy_consumption")
ec_count = cursor.fetchone()[0]
print(f"  Energy consumption records: {ec_count}")

cursor.execute("SELECT COUNT(*) FROM usage_patterns")
up_count = cursor.fetchone()[0]
print(f"  Usage pattern records: {up_count}")

cursor.execute("SELECT COUNT(*) FROM energy_forecasts")
ef_count = cursor.fetchone()[0]
print(f"  Energy forecast records: {ef_count}")

# Test TimescaleDB query
print("\n🧪 Testing TimescaleDB time_bucket query...")
cursor.execute("""
SELECT 
  time_bucket('1 hour', timestamp) AS hour,
  AVG(energy_kwh) as avg_consumption,
  usage_label
FROM energy_consumption
WHERE household_id = 1
  AND timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY hour, usage_label
ORDER BY hour
LIMIT 5
""")

results = cursor.fetchall()
print("  Sample hourly aggregation:")
for row in results:
    print(f"    {row}")

# Close connection
cursor.close()
conn.close()
print("\n✅ Database population complete!")
print("=" * 60)
