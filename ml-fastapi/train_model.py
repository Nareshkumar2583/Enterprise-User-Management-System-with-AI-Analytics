import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
import os

print("Booting up ML Training Pipeline...")

# 1. Synthesize Data
np.random.seed(42)
n_samples = 1000

print("Generating 1000 synthetic user profiles...")
data = {
    'login_frequency': np.random.poisson(lam=15, size=n_samples), # logins per month
    'session_duration': np.random.normal(loc=30, scale=10, size=n_samples), # avg minutes
    'failed_logins': np.random.poisson(lam=1, size=n_samples),
    'api_calls': np.random.poisson(lam=500, size=n_samples),
    'is_admin': np.random.choice([0, 1], p=[0.9, 0.1], size=n_samples),
    'days_since_last_login': np.random.exponential(scale=5, size=n_samples)
}

df = pd.DataFrame(data)

# Preprocessing - scale features
print("Scaling features via StandardScaler...")
scaler = StandardScaler()
X_scaled = scaler.fit_transform(df)

# 2. Train User Segmentation (K-Means Clustering)
print("Training User Segmentation Model (K-Means)...")
# 4 Clusters: e.g., Power User, Casual, Inactive, High-Value
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
df['cluster'] = kmeans.fit_predict(X_scaled)

# 3. Train Anomaly Detection (Isolation Forest)
print("Training Anomaly Detection Model (Isolation Forest)...")
iso_forest = IsolationForest(contamination=0.05, random_state=42) # 5% assumed anomalies
df['is_anomaly'] = iso_forest.fit_predict(X_scaled) 
# Isolation Forest returns -1 for anomaly, 1 for normal

# 4. Train Churn Prediction (Logistic Regression)
print("Training Churn Prediction Model (Logistic Regression)...")
# Synthetic Target: high days since login + low frequency = high churn
churn_target = ((df['days_since_last_login'] > 5) | (df['login_frequency'] < 10)).astype(int)
log_reg = LogisticRegression(random_state=42)
log_reg.fit(X_scaled, churn_target)

# 5. Train Risk Score / Engagement Score (Random Forest)
print("Training Risk Scoring Model (Random Forest)...")
# Synthetic Target: high failed logins + high api calls = high risk
risk_target = (df['failed_logins'] * 10) + (df['api_calls'] / 100) + (df['is_anomaly'] == -1)*30
# Clip to 0-100
risk_target = np.clip(risk_target * 1.5, 0, 100) 

rf_model = RandomForestRegressor(n_estimators=50, random_state=42)
rf_model.fit(X_scaled, risk_target)

# Compile mapping for clusters
cluster_mapping = {
    0: "Active/Stable",
    1: "Power User",
    2: "Dormant",
    3: "Casual"
}

# 6. Save Models to Disk
os.makedirs("models", exist_ok=True)
joblib.dump(scaler, "models/scaler.pkl")
joblib.dump(kmeans, "models/kmeans.pkl")
joblib.dump(iso_forest, "models/isolation_forest.pkl")
joblib.dump(log_reg, "models/churn_model.pkl")
joblib.dump(rf_model, "models/risk_model.pkl")

print("Pipeline Complete! Models saved to /models directory.")
