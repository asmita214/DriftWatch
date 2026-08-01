import requests
import random
import time

MODEL_ID = "5270bb9f-6022-4295-9ddb-97a3f14a8302"
BASE_URL = "http://localhost:8000"
TOKEN = "DW_oSzTCJRP409YK6cW_0khrQWmf7EAM8chVeybtYOAfHM"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

def send(payload):
    requests.post(f"{BASE_URL}/api/ingest/log-prediction",
        json=payload, headers=HEADERS, timeout=5)

def simulate_phase(label, n, age_range, income_range, devices, tenure_range, spend_range, conf_range, pred_weights):
    print(f"Sending {n} predictions — {label}...")
    for _ in range(n):
        send({
            "model_id": MODEL_ID,
            "input_features": {
                "age": random.randint(*age_range),
                "income": random.randint(*income_range),
                "device": random.choice(devices),
                "tenure_months": random.randint(*tenure_range),
                "monthly_spend": random.randint(*spend_range)
            },
            "prediction_output": random.choices(["will_churn", "will_stay"], weights=pred_weights)[0],
            "confidence_score": round(random.uniform(*conf_range), 2),
            "metadata": {"phase": label}
        })
    print(f"Done — {label}")

if __name__ == "__main__":
    simulate_phase("enterprise_stable", 80,
        age_range=(35, 60), income_range=(80000, 200000),
        devices=["desktop", "tablet"], tenure_range=(24, 84),
        spend_range=(300, 800), conf_range=(0.75, 0.98), pred_weights=[20, 80])
    time.sleep(1)
    simulate_phase("midmarket", 60,
        age_range=(28, 45), income_range=(40000, 80000),
        devices=["desktop", "mobile", "tablet"], tenure_range=(6, 24),
        spend_range=(100, 300), conf_range=(0.60, 0.85), pred_weights=[35, 65])
    time.sleep(1)
    simulate_phase("young_mobile_drift", 80,
        age_range=(18, 26), income_range=(8000, 22000),
        devices=["mobile"], tenure_range=(1, 4),
        spend_range=(5, 40), conf_range=(0.30, 0.55), pred_weights=[75, 25])
    time.sleep(1)
    simulate_phase("high_value_anomaly", 30,
        age_range=(45, 70), income_range=(300000, 800000),
        devices=["desktop"], tenure_range=(60, 120),
        spend_range=(2000, 8000), conf_range=(0.40, 0.65), pred_weights=[60, 40])
    print("All done. Check dashboard.")