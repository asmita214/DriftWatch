import requests
import random
import time

MODEL_ID = "5270bb9f-6022-4295-9ddb-97a3f14a8302"
BASE_URL = "http://localhost:8000"

def simulate_normal_predictions(n=50):
    print(f"Sending {n} normal predictions...")
    for i in range(n):
        requests.post(f"{BASE_URL}/api/ingest/log-prediction", json={
            "model_id": MODEL_ID,
            "input_features": {
                "age": random.randint(30, 55),
                "income": random.randint(40000, 90000),
                "device": random.choice(["desktop", "tablet"]),
                "tenure_months": random.randint(12, 60),
                "monthly_spend": random.randint(100, 300)
            },
            "prediction_output": random.choice(["will_churn", "will_stay"]),
            "confidence_score": round(random.uniform(0.6, 0.95), 2),
            "metadata": {"phase": "normal"}
        })
    print("Normal predictions done.")

def simulate_drifted_predictions(n=50):
    print(f"Sending {n} drifted predictions...")
    for i in range(n):
        requests.post(f"{BASE_URL}/api/ingest/log-prediction", json={
            "model_id": MODEL_ID,
            "input_features": {
                "age": random.randint(18, 25),
                "income": random.randint(8000, 20000),
                "device": "mobile",
                "tenure_months": random.randint(1, 3),
                "monthly_spend": random.randint(10, 50)
            },
            "prediction_output": "will_churn",
            "confidence_score": round(random.uniform(0.3, 0.55), 2),
            "metadata": {"phase": "drifted"}
        })
    print("Drifted predictions done.")

if __name__ == "__main__":
    simulate_normal_predictions(50)
    time.sleep(1)
    simulate_drifted_predictions(50)
    print("Simulation complete. Check Supabase.")