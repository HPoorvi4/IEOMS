import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.cluster import KMeans
from xgboost import XGBRegressor
import optuna
import pickle

print("\n======================================")
print("📊 LOADING DATA")
print("======================================")

df = pd.read_csv("smart_home_energy_consumption_large.csv")

# ============================================================
# 1. CLEAN DATA
# ============================================================
for col in df.columns:
    if df[col].dtype in ["int64", "float64"]:
        df[col] = df[col].fillna(df[col].median())
    else:
        df[col] = df[col].fillna(df[col].mode()[0])

df["datetime"] = pd.to_datetime(df["Date"] + " " + df["Time"])
df["hour"] = df["datetime"].dt.hour
df["weekday"] = df["datetime"].dt.dayofweek
df["is_weekend"] = (df["weekday"] >= 5).astype(int)
df["month"] = df["datetime"].dt.month
df["day"] = df["datetime"].dt.day

# ============================================================
# 2. K-MEANS CLUSTERING for Usage Behavior
# ============================================================
print("\n======================================")
print("⚡ RUNNING K-MEANS")
print("======================================")

cluster_features = ["hour", "weekday", "is_weekend", "Energy Consumption (kWh)"]
cluster_scaled = StandardScaler().fit_transform(df[cluster_features])

kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
df["cluster"] = kmeans.fit_predict(cluster_scaled)

cluster_avg = df.groupby("cluster")["Energy Consumption (kWh)"].mean().sort_values(ascending=False)

label_map = {
    cluster_avg.index[0]: "Peak",
    cluster_avg.index[1]: "Normal",
    cluster_avg.index[2]: "Off-Peak"
}

df["usage_label"] = df["cluster"].map(label_map)

le_usage = LabelEncoder()
df["usage_encoded"] = le_usage.fit_transform(df["usage_label"])

# ⭐ ADD CLUSTER PROBABILITY FEATURES
cluster_dist = kmeans.transform(cluster_scaled)
df["prob_peak"] = cluster_dist[:, cluster_avg.index[0]]
df["prob_normal"] = cluster_dist[:, cluster_avg.index[1]]
df["prob_offpeak"] = cluster_dist[:, cluster_avg.index[2]]

# ============================================================
# 3. PATTERN-BASED FEATURES
# ============================================================
appliance_base = df.groupby("Appliance Type")["Energy Consumption (kWh)"].mean().to_dict()
season_mult = df.groupby("Season")["Energy Consumption (kWh)"].mean() / df["Energy Consumption (kWh)"].mean()
season_mult = season_mult.to_dict()

household_factor = df.groupby("Household Size")["Energy Consumption (kWh)"].mean() / df["Energy Consumption (kWh)"].mean()
household_factor = household_factor.to_dict()

monthly_mult = df.groupby("month")["Energy Consumption (kWh)"].mean() / df["Energy Consumption (kWh)"].mean()
monthly_mult = monthly_mult.to_dict()

daily_mult = df.groupby("weekday")["Energy Consumption (kWh)"].mean() / df["Energy Consumption (kWh)"].mean()
daily_mult = daily_mult.to_dict()

temp_coeff = {}
for app in ["Heater", "Air Conditioning"]:
    ss = df[df["Appliance Type"] == app]
    temp_coeff[app] = ss["Outdoor Temperature (°C)"].corr(ss["Energy Consumption (kWh)"])

def add_features(d):
    d["Appliance_Base"] = d["Appliance Type"].map(appliance_base)
    d["Season_M"] = d["Season"].map(season_mult)
    d["House_F"] = d["Household Size"].map(household_factor)
    d["Month_M"] = d["month"].map(monthly_mult)
    d["Day_M"] = d["weekday"].map(daily_mult)

    d["Temp_Impact"] = 0.0
    for app, coef in temp_coeff.items():
        mask = d["Appliance Type"] == app
        d.loc[mask, "Temp_Impact"] = d.loc[mask, "Outdoor Temperature (°C)"] * coef

    return d

df = add_features(df)

# ============================================================
# 4. ADD LAG + ROLLING FEATURES (MAJOR BOOST)
# ============================================================
df["lag_1"] = df["Energy Consumption (kWh)"].shift(1)
df["lag_2"] = df["Energy Consumption (kWh)"].shift(2)
df["lag_3"] = df["Energy Consumption (kWh)"].shift(3)

df["rolling_3"] = df["Energy Consumption (kWh)"].rolling(3).mean()
df["rolling_6"] = df["Energy Consumption (kWh)"].rolling(6).mean()
df["rolling_12"] = df["Energy Consumption (kWh)"].rolling(12).mean()

df = df.dropna().reset_index(drop=True)

# ============================================================
# 5. ENCODERS
# ============================================================
le_app = LabelEncoder()
le_season = LabelEncoder()

df["Appliance_encoded"] = le_app.fit_transform(df["Appliance Type"])
df["Season_encoded"] = le_season.fit_transform(df["Season"])

# ============================================================
# 6. FINAL FEATURES
# ============================================================
features = [
    "Appliance_encoded", "Outdoor Temperature (°C)", "Season_encoded",
    "Household Size", "hour", "weekday", "month",
    "Appliance_Base", "Season_M", "House_F", "Month_M", "Day_M",
    "Temp_Impact",
    "usage_encoded", "prob_peak", "prob_normal", "prob_offpeak",
    "lag_1", "lag_2", "lag_3",
    "rolling_3", "rolling_6", "rolling_12"
]

target = "Energy Consumption (kWh)"

X = df[features]
y = df[target]

# ============================================================
# 7. TRAIN/TEST SPLIT + SCALING
# ============================================================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

scaler_x = StandardScaler()
X_train_scaled = scaler_x.fit_transform(X_train)
X_test_scaled = scaler_x.transform(X_test)

scaler_y = StandardScaler()
y_train_scaled = scaler_y.fit_transform(y_train.values.reshape(-1, 1)).flatten()

# ============================================================
# 8. OPTUNA HYPERPARAMETER TUNING
# ============================================================
print("\n======================================")
print("🎯 OPTUNA HYPERPARAMETER TUNING")
print("======================================")

def objective(trial):
    params = {
        "n_estimators": trial.suggest_int("n_estimators", 300, 800),
        "max_depth": trial.suggest_int("max_depth", 3, 12),
        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3),
        "subsample": trial.suggest_float("subsample", 0.6, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
        "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
        "gamma": trial.suggest_float("gamma", 0, 5),
        "reg_alpha": trial.suggest_float("reg_alpha", 0.0, 1.0),
        "reg_lambda": trial.suggest_float("reg_lambda", 0.0, 2.0),
        "random_state": 42,
        "n_jobs": -1,
    }

    model = XGBRegressor(**params)
    model.fit(X_train_scaled, y_train_scaled)

    pred_scaled = model.predict(X_test_scaled)
    pred = scaler_y.inverse_transform(pred_scaled.reshape(-1, 1)).flatten()

    return r2_score(y_test, pred)

study = optuna.create_study(direction="maximize")
study.optimize(objective, n_trials=30)

print("\nBest Params:", study.best_params)

# ============================================================
# 9. TRAIN FINAL MODEL WITH OPTUNA BEST PARAMETERS
# ============================================================
model = XGBRegressor(**study.best_params)
model.fit(X_train_scaled, y_train_scaled)

# ============================================================
# 10. EVALUATE FINAL MODEL
# ============================================================
pred_scaled = model.predict(X_test_scaled)
pred = scaler_y.inverse_transform(pred_scaled.reshape(-1, 1)).flatten()

r2 = r2_score(y_test, pred)
mae = mean_absolute_error(y_test, pred)
mse = mean_squared_error(y_test, pred)
rmse = np.sqrt(mse)

print("\n======================================")
print("📈 FINAL XGBOOST PERFORMANCE (OPTIMIZED)")
print("======================================")
print(f"R² Score : {r2:.4f}")
print(f"MAE      : {mae:.4f} kWh")
print(f"MSE      : {mse:.4f}")
print(f"RMSE     : {rmse:.4f} kWh")
print("======================================")

# ============================================================
# 11. SAVE MODELS AND ENCODERS
# ============================================================
with open('models/xgboost_model.pkl', 'wb') as f:
    pickle.dump(model, f)
with open('models/scaler_x.pkl', 'wb') as f:
    pickle.dump(scaler_x, f)
with open('models/scaler_y.pkl', 'wb') as f:
    pickle.dump(scaler_y, f)
with open('models/le_app.pkl', 'wb') as f:
    pickle.dump(le_app, f)
with open('models/le_season.pkl', 'wb') as f:
    pickle.dump(le_season, f)
with open('models/le_usage.pkl', 'wb') as f:
    pickle.dump(le_usage, f)
with open('models/appliance_base.pkl', 'wb') as f:
    pickle.dump(appliance_base, f)
with open('models/season_mult.pkl', 'wb') as f:
    pickle.dump(season_mult, f)
with open('models/household_factor.pkl', 'wb') as f:
    pickle.dump(household_factor, f)
with open('models/monthly_mult.pkl', 'wb') as f:
    pickle.dump(monthly_mult, f)
with open('models/daily_mult.pkl', 'wb') as f:
    pickle.dump(daily_mult, f)
with open('models/temp_coeff.pkl', 'wb') as f:
    pickle.dump(temp_coeff, f)

print("\n✅ All models and encoders saved to models/ directory")

# ============================================================
# 12. SAVE PROCESSED DATA WITH PREDICTIONS
# ============================================================
# Add predictions to the full dataset
df_full = df.copy()
X_full = df_full[features]
X_full_scaled = scaler_x.transform(X_full)
pred_full_scaled = model.predict(X_full_scaled)
pred_full = scaler_y.inverse_transform(pred_full_scaled.reshape(-1, 1)).flatten()
df_full['predicted_energy_kwh'] = pred_full

df_full.to_csv('models/data_with_predictions.csv', index=False)
print("✅ Full dataset with predictions saved to models/data_with_predictions.csv")

# ============================================================
# 13. FORECASTING FUNCTION
# ============================================================
def forecast_energy(app, temp, season, house, hr, day, mon, usage_label):
    usage_encoded = le_usage.transform([usage_label])[0]

    feat = pd.DataFrame([[
        le_app.transform([app])[0],
        temp,
        le_season.transform([season])[0],
        house,
        hr,
        day,
        mon,
        appliance_base[app],
        season_mult[season],
        household_factor[house],
        monthly_mult[mon],
        daily_mult[day],
        temp * temp_coeff.get(app, 0),
        usage_encoded,
        0, 0, 0,  # placeholder for prob features (not known in future)
        0, 0, 0,
        0, 0, 0
    ]], columns=features)

    feat_scaled = scaler_x.transform(feat)
    pred_scaled = model.predict(feat_scaled)[0]
    return float(scaler_y.inverse_transform([[pred_scaled]])[0][0])

# Save the forecast function for later use
with open('models/forecast_function.pkl', 'wb') as f:
    pickle.dump(forecast_energy, f)

print("✅ Forecast function saved")
print("\n🎉 XGBoost training complete!")
