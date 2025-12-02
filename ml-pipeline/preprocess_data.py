# -----------------------------
# 📌 Data Preprocessing
# -----------------------------
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

# Load dataset
data = pd.read_csv("smart_home_energy_consumption_large.csv")

# Handle missing values
for col in data.columns:
    if data[col].dtype in ["int64", "float64"]:
        data[col].fillna(data[col].median(), inplace=True)
    else:
        data[col].fillna(data[col].mode()[0], inplace=True)

# Convert datetime column (assuming column name = 'timestamp')
data['datetime'] = pd.to_datetime(data['Date'] + ' ' + data['Time'])

# Extract time-based features
data['hour'] = data['datetime'].dt.hour
data['day'] = data['datetime'].dt.day
data['month'] = data['datetime'].dt.month
data['weekday'] = data['datetime'].dt.dayofweek
data['is_weekend'] = data['weekday'].apply(lambda x: 1 if x >= 5 else 0)

# Season feature (basic categorization)
def get_season(month):
    if month in [12, 1, 2]:
        return 'winter'
    elif month in [3, 4, 5]:
        return 'spring'
    elif month in [6, 7, 8]:
        return 'summer'
    else:
        return 'autumn'
data['season'] = data['month'].apply(get_season)

# Encode 'season'
data = pd.get_dummies(data, columns=['season'], drop_first=True)

# Select relevant features
features = ['hour', 'day', 'month', 'weekday', 'is_weekend',
            'season_spring', 'season_summer', 'season_winter', 'Energy Consumption (kWh)']

X = data[features]

# Standardize
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

print("✅ Preprocessing done. Shape:", X_scaled.shape)
