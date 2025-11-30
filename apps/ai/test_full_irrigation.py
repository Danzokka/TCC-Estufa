#!/usr/bin/env python3
"""
Test script for ESP Simulator + Auto Irrigation Integration
Runs both components and tests the complete irrigation flow
"""

import subprocess
import time
import requests
import json
import sys
import threading
import signal

SIMULATOR_PORT = 8080
BACKEND_URL = "http://localhost:5000"
GREENHOUSE_ID = "f28ed112-f59c-47ac-a43b-4138f656f93e"
TEST_DURATION = 60  # seconds to run the test

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(msg, color=Colors.BLUE):
    print(f"{color}[TEST] {msg}{Colors.END}")

def log_success(msg):
    log(f"✅ {msg}", Colors.GREEN)

def log_error(msg):
    log(f"❌ {msg}", Colors.RED)

def log_info(msg):
    log(f"ℹ️  {msg}", Colors.CYAN)

def log_warning(msg):
    log(f"⚠️  {msg}", Colors.YELLOW)

def check_backend():
    """Check if backend is running"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def check_simulator():
    """Check if simulator is running"""
    try:
        response = requests.get(f"http://localhost:{SIMULATOR_PORT}/status", timeout=5)
        return response.status_code == 200
    except:
        return False

def get_sensor_data():
    """Get current sensor data from backend"""
    try:
        url = f"{BACKEND_URL}/sensor/greenhouse/{GREENHOUSE_ID}/latest"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('data'):
                return data['data']
    except Exception as e:
        log_error(f"Error getting sensor data: {e}")
    return None

def set_scenario(scenario: str):
    """Set simulator scenario"""
    try:
        response = requests.post(
            f"http://localhost:{SIMULATOR_PORT}/sim/scenario",
            json={"scenario": scenario},
            timeout=5
        )
        if response.status_code == 200:
            log_success(f"Set scenario: {scenario}")
            return True
    except Exception as e:
        log_error(f"Error setting scenario: {e}")
    return False

def activate_pump(duration: int):
    """Activate pump via simulator"""
    try:
        response = requests.post(
            f"http://localhost:{SIMULATOR_PORT}/pump/activate",
            json={"duration": duration},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_success(f"Pump activated for {duration}s")
            return data
        else:
            log_error(f"Pump activation failed: {response.status_code}")
    except Exception as e:
        log_error(f"Error activating pump: {e}")
    return None

def get_pump_status():
    """Get pump status from simulator"""
    try:
        response = requests.get(f"http://localhost:{SIMULATOR_PORT}/pump/status", timeout=5)
        if response.status_code == 200:
            return response.json()
    except:
        pass
    return None

def get_irrigations():
    """Get recent irrigations from backend"""
    try:
        # Use the greenhouse endpoint
        url = f"{BACKEND_URL}/irrigations/greenhouse/{GREENHOUSE_ID}?limit=5"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('data', [])
    except Exception as e:
        log_error(f"Error getting irrigations: {e}")
    return []

def get_notifications():
    """Get notifications for test user"""
    try:
        # Assuming we can get notifications via some endpoint
        url = f"{BACKEND_URL}/notifications?userId=f954b437-0306-40ea-92a4-4e8f562b8ba8&limit=5"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return response.json()
    except:
        pass
    return []

def main():
    print("\n" + "="*60)
    print("🧪 ESP SIMULATOR + AUTO IRRIGATION TEST")
    print("="*60)
    
    # Step 1: Check prerequisites
    log_info("Checking prerequisites...")
    
    if not check_backend():
        log_error("Backend not running at http://localhost:5000")
        log_info("Start the backend with: cd apps/api && pnpm dev")
        sys.exit(1)
    log_success("Backend is running")
    
    if not check_simulator():
        log_error("Simulator not running at http://localhost:8080")
        log_info("Start the simulator with: cd apps/esp-simulator && python simulator.py --scenario dry")
        sys.exit(1)
    log_success("Simulator is running")
    
    # Step 2: Check initial state
    log_info("\nStep 1: Getting initial sensor data...")
    sensor_data = get_sensor_data()
    
    if sensor_data and sensor_data.get('latestReading'):
        reading = sensor_data['latestReading']
        print(f"\n📊 Current Readings:")
        print(f"   🌡️  Air Temperature: {reading.get('airTemperature')}°C")
        print(f"   💧 Air Humidity: {reading.get('airHumidity')}%")
        print(f"   🌱 Soil Moisture: {reading.get('soilMoisture')}%")
        print(f"   🌡️  Soil Temperature: {reading.get('soilTemperature')}°C")
        
        initial_moisture = reading.get('soilMoisture')
    else:
        log_error("Could not get initial sensor data")
        sys.exit(1)
    
    # Step 3: Set dry scenario if not already
    log_info("\nStep 2: Setting dry scenario...")
    set_scenario("dry")
    time.sleep(2)  # Wait for scenario to apply
    
    # Step 4: Check soil moisture again
    log_info("\nStep 3: Checking soil moisture after dry scenario...")
    sensor_data = get_sensor_data()
    if sensor_data and sensor_data.get('latestReading'):
        moisture = sensor_data['latestReading'].get('soilMoisture')
        print(f"   🌱 Soil Moisture: {moisture}%")
        
        if moisture < 30:
            log_success(f"Soil is dry ({moisture}%) - irrigation should be recommended")
        else:
            log_warning(f"Soil moisture ({moisture}%) is above threshold")
    
    # Step 5: Activate pump manually
    log_info("\nStep 4: Activating pump for 5 seconds...")
    pump_result = activate_pump(5)
    
    if pump_result:
        print(f"   ⏱️  Duration: {pump_result.get('duration_ms')}ms")
        print(f"   💧 Estimated volume: {pump_result.get('estimated_volume', 0) * 1000:.0f}ml")
        
        # Wait for pump to finish
        log_info("   Waiting for pump to complete...")
        time.sleep(6)
        
        # Check pump status
        pump_status = get_pump_status()
        if pump_status:
            print(f"   🔧 Pump status: {pump_status.get('status')}")
    
    # Step 6: Wait for simulator to send updated data
    log_info("\nStep 5: Waiting for updated sensor data (15s)...")
    time.sleep(15)
    
    # Step 7: Check new soil moisture
    log_info("\nStep 6: Checking soil moisture after irrigation...")
    sensor_data = get_sensor_data()
    if sensor_data and sensor_data.get('latestReading'):
        new_moisture = sensor_data['latestReading'].get('soilMoisture')
        print(f"   🌱 Soil Moisture: {new_moisture}%")
        
        if new_moisture > initial_moisture:
            increase = new_moisture - initial_moisture
            log_success(f"Soil moisture increased by {increase:.1f}%")
            
            if increase >= 15:
                log_success(f"Increase >= 15% - should trigger irrigation detection!")
        else:
            log_warning("Soil moisture did not increase")
    
    # Step 8: Check for detected irrigations
    log_info("\nStep 7: Checking for detected irrigations...")
    irrigations = get_irrigations()
    
    if irrigations:
        print(f"\n📊 Recent Irrigations ({len(irrigations)} found):")
        for irr in irrigations[:3]:
            print(f"   💧 ID: {irr.get('id', 'N/A')[:8]}...")
            print(f"      Detected at: {irr.get('detectedAt', 'N/A')}")
            print(f"      Moisture increase: {irr.get('moistureIncrease', 'N/A')}%")
            print(f"      Confirmed: {irr.get('isConfirmed', False)}")
    else:
        log_warning("No irrigations found yet")
    
    # Summary
    print("\n" + "="*60)
    print("📋 TEST SUMMARY")
    print("="*60)
    print(f"   ✅ Backend: Running")
    print(f"   ✅ Simulator: Running")
    print(f"   🌱 Initial moisture: {initial_moisture}%")
    print(f"   💧 Pump activated: {'Yes' if pump_result else 'No'}")
    print(f"   📊 Irrigations detected: {len(irrigations)}")
    print("="*60 + "\n")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        log_error(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
