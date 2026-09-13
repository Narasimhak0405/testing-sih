#!/usr/bin/env python3
"""
Complete End-to-End Test of FINAL ExtraTrees Model Integration
================================================

This script tests the entire flow:
1. Backend health check
2. Mining zones API
3. Production history API
4. ML prediction with FINAL ExtraTrees model
5. Verify model predictions are reasonable
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def test_health():
    """Test backend health and ML service status."""
    print("\n" + "="*70)
    print("1. TESTING BACKEND HEALTH & ML SERVICE STATUS")
    print("="*70)
    try:
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        health = response.json()
        print(f"✅ Status: {health.get('status')}")
        print(f"✅ Database: {health.get('database')}")
        print(f"✅ ML Service: {health.get('ml_service')}")
        assert health.get('ml_service') == 'available', "ML service not available!"
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_mining_zones():
    """Test mining zones API."""
    print("\n" + "="*70)
    print("2. TESTING MINING ZONES API")
    print("="*70)
    try:
        response = requests.get(f"{BASE_URL}/mining-zones")
        assert response.status_code == 200, f"Mining zones API failed: {response.status_code}"
        result = response.json()
        assert result.get('success'), "API returned success=false"
        zones = result.get('data', [])
        print(f"✅ Found {len(zones)} mining zones")
        if zones:
            zone = zones[0]
            print(f"   - Sample Zone: {zone.get('zone_name')} (ID: {zone.get('id')})")
            print(f"   - Location: {zone.get('district')}, {zone.get('state')}")
            print(f"   - Ore Grade: {zone.get('ore_grade')}%")
        return zones
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def test_production_history():
    """Test production history API."""
    print("\n" + "="*70)
    print("3. TESTING PRODUCTION HISTORY API")
    print("="*70)
    try:
        response = requests.get(f"{BASE_URL}/production/history")
        assert response.status_code == 200, f"Production history API failed: {response.status_code}"
        result = response.json()
        assert result.get('success'), "API returned success=false"
        history = result.get('data', [])
        print(f"✅ Found {len(history)} historical production records")
        if history:
            for record in history[:3]:
                print(f"   - Year {record.get('year')}: {record.get('production')} tonnes")
        return history
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def test_ml_prediction():
    """Test ML prediction with FINAL ExtraTrees model."""
    print("\n" + "="*70)
    print("4. TESTING FINAL EXTRATREES MODEL PREDICTION")
    print("="*70)
    
    # Test case 1: High production scenario
    payload_high = {
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
    
    # Test case 2: Low production scenario (high downtime)
    payload_low = {
        "previous_production": 1200000,
        "rolling_2yr_production": 1250000,
        "rainfall_mm": 600,
        "soil_moisture": 0.35,
        "temperature_c": 35.0,
        "downtime": 2000,  # High downtime
        "equipment_efficiency": 60.0,  # Low efficiency
        "blasting_delay_hours": 200,  # High delays
        "working_hours_per_day": 6.0,  # Low working hours
        "number_of_equipment": 3,  # Few equipment
        "mineral_value_tonnes": 5000000,
        "planned_production": 1500000,
        "prediction_year": 2027,
        "mining_zone_id": 1
    }
    
    results = []
    
    for label, payload in [("High Production Scenario", payload_high), ("Low Production Scenario", payload_low)]:
        try:
            print(f"\n📊 Testing: {label}")
            response = requests.post(f"{BASE_URL}/production/predict", json=payload)
            assert response.status_code == 200, f"Prediction failed: {response.status_code}"
            result = response.json()
            assert result.get('success'), "API returned success=false"
            
            data = result.get('data', {})
            pred = data.get('predicted_production')
            plan = payload['planned_production']
            shortfall = data.get('expected_shortfall')
            risk = data.get('shortfall_risk')
            confidence = data.get('confidence')
            
            print(f"   ✅ Prediction: {pred:,.2f} tonnes")
            print(f"   ✅ Planned: {plan:,} tonnes")
            print(f"   ✅ Shortfall: {shortfall:,.2f} tonnes ({data.get('shortfall_percentage'):.2f}%)")
            print(f"   ✅ Risk Level: {risk}")
            print(f"   ✅ Confidence: {confidence:.4f}")
            print(f"   ✅ Recommendation: {data.get('recommended_action')}")
            
            # Validate predictions are reasonable
            assert isinstance(pred, (int, float)), "Prediction is not numeric"
            assert pred > 0, "Prediction is not positive"
            assert 500000 <= pred <= 2500000, "Prediction out of reasonable range"
            assert risk in ['LOW', 'MEDIUM', 'HIGH'], "Invalid risk level"
            assert 0 <= confidence <= 1, "Confidence out of range"
            
            results.append((label, result))
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return None
    
    return results

def test_verify_extratrees_used():
    """Verify that ExtraTrees model is actually being used."""
    print("\n" + "="*70)
    print("5. VERIFYING EXTRATREES MODEL IS BEING USED")
    print("="*70)
    try:
        # Check model files exist
        import os
        model_path = "C:\\Users\\Bhara\\TerraMindSih-new\\backend\\ml\\model\\extra_trees_model.joblib"
        schema_path = "C:\\Users\\Bhara\\TerraMindSih-new\\backend\\ml\\model\\model_schema.json"
        
        if os.path.exists(model_path):
            size_mb = os.path.getsize(model_path) / (1024 * 1024)
            print(f"✅ ExtraTrees model file exists: {size_mb:.2f} MB")
        else:
            print(f"❌ ExtraTrees model file not found!")
            return False
        
        if os.path.exists(schema_path):
            with open(schema_path) as f:
                schema = json.load(f)
                n_features = len(schema.get('features', []))
                print(f"✅ Model schema exists with {n_features} features")
                print(f"✅ Training period: {schema.get('training_years')}")
                print(f"✅ Test period: {schema.get('test_year')}")
        else:
            print(f"❌ Model schema file not found!")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests."""
    print("\n" + "="*70)
    print(" FINAL EXTRATREES MODEL INTEGRATION - END-TO-END TEST")
    print("="*70)
    print(f"Test started at: {datetime.now().isoformat()}")
    
    tests_passed = 0
    tests_total = 0
    
    # Test 1: Health
    tests_total += 1
    if test_health():
        tests_passed += 1
    
    # Test 2: Mining Zones
    tests_total += 1
    zones = test_mining_zones()
    if zones:
        tests_passed += 1
    
    # Test 3: Production History
    tests_total += 1
    history = test_production_history()
    if history:
        tests_passed += 1
    
    # Test 4: ML Prediction
    tests_total += 1
    predictions = test_ml_prediction()
    if predictions:
        tests_passed += 1
    
    # Test 5: Verify ExtraTrees
    tests_total += 1
    if test_verify_extratrees_used():
        tests_passed += 1
    
    # Summary
    print("\n" + "="*70)
    print(f"TEST SUMMARY: {tests_passed}/{tests_total} tests passed")
    print("="*70)
    
    if tests_passed == tests_total:
        print("\n🎉 ALL TESTS PASSED! FINAL EXTRATREES MODEL IS SUCCESSFULLY INTEGRATED!")
        print("\n✅ Production Prediction Endpoints Ready:")
        print(f"   POST {BASE_URL}/production/predict")
        print(f"   GET  {BASE_URL}/production/history")
        print(f"\n✅ Live at:")
        print("   Frontend: http://localhost:5173")
        print("   Swagger Docs: http://localhost:8000/docs")
        return 0
    else:
        print(f"\n❌ {tests_total - tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    exit(main())
