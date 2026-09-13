#!/usr/bin/env python3
"""Test backend health and ML service status."""

import requests

# Test health endpoint
try:
    response = requests.get("http://localhost:8000/api/v1/health")
    if response.status_code == 200:
        health = response.json()
        print("✅ Backend Health Status:")
        print(f"  Status: {health.get('status')}")
        print(f"  Database: {health.get('database')}")
        print(f"  ML Service: {health.get('ml_service')}")
    else:
        print(f"❌ Health check failed: {response.status_code}")
except Exception as e:
    print(f"❌ Error: {e}")
