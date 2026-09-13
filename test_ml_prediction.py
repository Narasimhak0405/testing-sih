#!/usr/bin/env python3
"""Test the FINAL ExtraTrees model prediction API."""

import requests
import json

payload = {
    "previous_production": 1751000,
    "rolling_2yr_production": 1575500,
    "rainfall_mm": 1231,
    "soil_moisture": 0.563,
    "temperature_c": 28.9,
    "downtime": 660.1,
    "equipment_efficiency": 81.9,
    "blasting_delay_hours": 71.8,
    "working_hours_per_day": 9.1,
    "number_of_equipment": 7,
    "mineral_value_tonnes": 13100000,
    "planned_production": 1650000,
    "prediction_year": 2027,
    "mining_zone_id": 1
}

try:
    print("Testing FINAL ExtraTrees Model Prediction API...")
    print(f"Payload: {json.dumps(payload, indent=2)}\n")
    
    response = requests.post("http://localhost:8000/api/v1/production/predict", json=payload)
    print(f"Status: {response.status_code}")
    result = response.json()
    
    print("\n✅ ML PREDICTION SUCCESS!")
    print(json.dumps(result, indent=2))
    
    if result.get("success"):
        data = result.get("data", {})
        print(f"\n📊 PREDICTION RESULTS:")
        print(f"  Predicted Production: {data.get('predicted_production')} tonnes")
        print(f"  Planned Production: {payload['planned_production']} tonnes")
        print(f"  Shortfall Risk: {data.get('shortfall_risk')}")
        print(f"  Expected Shortfall: {data.get('expected_shortfall')} tonnes")
        print(f"  Confidence: {data.get('confidence')}")
        print(f"  Recommendation: {data.get('recommended_action')}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
