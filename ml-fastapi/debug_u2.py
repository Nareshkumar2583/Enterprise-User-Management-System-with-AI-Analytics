
import joblib
import pandas as pd
import numpy as np
import hashlib

scaler = joblib.load("models/scaler.pkl")
model = joblib.load("models/churn_model.pkl")

email = "new@hire.com"
hash_val = int(hashlib.md5(email.encode('utf-8')).hexdigest(), 16)

login_freq = (hash_val % 25) + 5
session_dur = (hash_val % 120) + 10
failed_logins = (hash_val % 4)
api_calls = (hash_val % 1200)
is_admin = 0
days_since_login = (hash_val % 30)

print(f"Metrics: freq={login_freq}, dur={session_dur}, failed={failed_logins}, api={api_calls}, days={days_since_login}")

test_df = pd.DataFrame([{
    'login_frequency': login_freq,
    'session_duration': session_dur,
    'failed_logins': failed_logins,
    'api_calls': api_calls,
    'is_admin': is_admin,
    'days_since_last_login': days_since_login
}])

X = scaler.transform(test_df)
print(f"Scaled: {X}")
prob = model.predict_proba(X)
print(f"Prob: {prob}")
print(f"Classes: {model.classes_}")
