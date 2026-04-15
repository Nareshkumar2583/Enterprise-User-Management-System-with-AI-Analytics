
import joblib
import pandas as pd
import numpy as np

scaler = joblib.load("models/scaler.pkl")
model = joblib.load("models/churn_model.pkl")

print(f"Model classes: {model.classes_}")
print(f"Scaler means: {scaler.mean_}")
print(f"Scaler scales: {scaler.scale_}")
print(f"Model coefficients: {model.coef_}")
print(f"Model intercept: {model.intercept_}")

# Test a 'Healthy' case
# login_freq=25, session_dur=60, failed=0, api=500, admin=0, days=2
test_df = pd.DataFrame([{
    'login_frequency': 25,
    'session_duration': 60,
    'failed_logins': 0,
    'api_calls': 500,
    'is_admin': 0,
    'days_since_last_login': 2
}])

X = scaler.transform(test_df)
print(f"Scaled features: {X}")
prob = model.predict_proba(X)
print(f"Probability: {prob}")
