# -----------------------------
# ⚡ Smart Energy Management System - Peak Hour Detection using K-Means
# -----------------------------
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import pickle

# 1️⃣ Load and Clean Data
data = pd.read_csv("smart_home_energy_consumption_large.csv")

# Handle missing values
for col in data.columns:
    if data[col].dtype in ["int64", "float64"]:
        data[col].fillna(data[col].median(), inplace=True)
    else:
        data[col].fillna(data[col].mode()[0], inplace=True)

# 2️⃣ Extract Time-based Features
data['datetime'] = pd.to_datetime(data['Date'] + ' ' + data['Time'])
data['hour'] = data['datetime'].dt.hour
data['day'] = data['datetime'].dt.day
data['month'] = data['datetime'].dt.month
data['weekday'] = data['datetime'].dt.dayofweek
data['is_weekend'] = data['weekday'].apply(lambda x: 1 if x >= 5 else 0)


# Season feature
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
data = pd.get_dummies(data, columns=['season'], drop_first=True)

# 3️⃣ Select Features for Clustering
# We will use time-based features and energy consumption for clustering
X = data[['hour',  'weekday', 'is_weekend', 'Energy Consumption (kWh)']]

# 4️⃣ Scale the Data
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 5️⃣ Apply K-Means Clustering
# Using 3 clusters for Peak, Normal, and Off-Peak
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10) # Added n_init for clarity
data['cluster'] = kmeans.fit_predict(X_scaled)

# 6️⃣ Evaluate Cluster Quality
sil_score = silhouette_score(X_scaled, data['cluster'])
print(f"✅ Silhouette Score (K-Means): {sil_score:.2f}")

# 7️⃣ Label Clusters as Peak / Normal / Off-Peak
# Sort clusters by average energy consumption to assign labels
cluster_avg = data.groupby('cluster')['Energy Consumption (kWh)'].mean().sort_values(ascending=False)

# Map labels dynamically based on average energy consumption
labels = {}
if len(cluster_avg) >= 3:
    labels[cluster_avg.index[0]] = "Peak"
    labels[cluster_avg.index[1]] = "Normal"
    labels[cluster_avg.index[2]] = "Off-Peak"
elif len(cluster_avg) == 2:
    labels[cluster_avg.index[0]] = "Peak"
    labels[cluster_avg.index[1]] = "Off-Peak"
else:
    if len(cluster_avg) > 0:
      labels[cluster_avg.index[0]] = "Normal"

data['usage_label'] = data['cluster'].map(labels)

# -----------------------------
# 🔹 Analyze Clusters
# -----------------------------
print("\nAverage Energy Consumption per Cluster:")
print(cluster_avg)

# -----------------------------
# 🔹 Analyze Appliance Energy Consumption within Clusters
# -----------------------------
print("\nAverage Energy Consumption by Appliance Type within each Usage Label:")
appliance_cluster_summary = data.groupby(['usage_label', 'Appliance Type'])['Energy Consumption (kWh)'].mean().unstack()
print(appliance_cluster_summary)


# 8️⃣ Visualization: Energy Consumption vs. Hour with Usage Labels
plt.figure(figsize=(10,5))
colors = {'Peak':'red', 'Normal':'orange', 'Off-Peak':'green'}
# Use the usage_label for coloring in the scatter plot
plt.scatter(data['hour'], data['Energy Consumption (kWh)'],
            c=data['usage_label'].map(colors), s=20, alpha=0.6)
plt.title("⚡ Energy Consumption vs. Hour by Usage Label (K-Means)")
plt.xlabel("Hour of Day")
plt.ylabel("Energy Consumption (kWh)")
plt.grid(True)
plt.savefig('models/kmeans_visualization.png')
print("\n✅ Visualization saved to models/kmeans_visualization.png")

# 9️⃣ Average Usage by Label
summary = data.groupby('usage_label')['Energy Consumption (kWh)'].mean().sort_values(ascending=False)
print("\n🔍 Average Energy Consumption by Usage Label:")
print(summary)

# 🔟 Peak Hour Range Analysis (based on frequency of each hour in the cluster)
# Get the hour counts for each usage label
peak_hours_counts = data[data['usage_label'] == 'Peak']['hour'].value_counts().sort_index()
normal_hours_counts = data[data['usage_label'] == 'Normal']['hour'].value_counts().sort_index()
offpeak_hours_counts = data[data['usage_label'] == 'Off-Peak']['hour'].value_counts().sort_index()

print("\n⏰ Hourly Distribution within Usage Labels:")
print("Peak Hours Distribution:\n", peak_hours_counts)
print("\nNormal Hours Distribution:\n", normal_hours_counts)
print("\nOff-Peak Hours Distribution:\n", offpeak_hours_counts)


# -----------------------------
# 🔹 Summary Output
# -----------------------------
print("\nCluster → Label Mapping:")
for c, lbl in labels.items():
    print(f"Cluster {c}: {lbl}")

print("\n🔹 Interpretation:")
if "Peak" in (data['usage_label'].values if 'usage_label' in data.columns else []):
    print("Peak Hours → Periods with highest energy consumption.")
if "Normal" in (data['usage_label'].values if 'usage_label' in data.columns else []):
    print("Normal Hours → Moderate usage times.")
if "Off-Peak" in (data['usage_label'].values if 'usage_label' in data.columns else []):
    print("Off-Peak Hours → Minimal energy consumption (midnight–morning).")

# Automatic Interpretation of Peak/Normal/Off-Peak Hours (based on hours with highest counts)
print("\n🔹 Automatic Interpretation of Hourly Ranges:")

def get_dominant_hour_range(hour_counts):
    if hour_counts.empty:
        return "No data available"
    # Find hours with counts above a certain threshold (e.g., 75th percentile)
    threshold = hour_counts.quantile(0.75) if len(hour_counts) > 1 else hour_counts.min()
    dominant_hours = hour_counts[hour_counts >= threshold].index.tolist()
    if not dominant_hours:
        return "No clear dominant hours"
    # Attempt to find continuous ranges
    ranges = []
    if dominant_hours:
        start = dominant_hours[0]
        end = dominant_hours[0]
        for i in range(1, len(dominant_hours)):
            if dominant_hours[i] == end + 1:
                end = dominant_hours[i]
            else:
                ranges.append(f"{start}:00 – {end}:00")
                start = dominant_hours[i]
                end = dominant_hours[i]
        ranges.append(f"{start}:00 – {end}:00") # Add the last range
    return ", ".join(ranges) if ranges else "No clear dominant hours"


peak_range = get_dominant_hour_range(peak_hours_counts)
normal_range = get_dominant_hour_range(normal_hours_counts)
offpeak_range = get_dominant_hour_range(offpeak_hours_counts)

print(f"Peak Hours (Highest Usage): {peak_range}")
print(f"Normal Hours (Moderate Usage): {normal_range}")
print(f"Off-Peak Hours (Low Usage): {offpeak_range}")


# -----------------------------
# 🔹 Print Sample Results
# -----------------------------
print("\nSample Clustered Data:")
print(data[['datetime', 'hour', 'Appliance Type', 'Energy Consumption (kWh)', 'cluster', 'usage_label']].head(10))

# -----------------------------
# 🔹 Save Model
# -----------------------------
with open('models/kmeans_model.pkl', 'wb') as f:
    pickle.dump(kmeans, f)
print("\n✅ K-Means model saved to models/kmeans_model.pkl")

# Save the processed data with usage labels
data.to_csv('models/data_with_clusters.csv', index=False)
print("✅ Processed data saved to models/data_with_clusters.csv")
