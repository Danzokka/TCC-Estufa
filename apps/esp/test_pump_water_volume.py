#!/usr/bin/env python3
"""
Test script to measure water volume dispensed by the pump in 1 second.
Calculates water volume based on the pump's water release rate per second.

Usage:
    python test_pump_water_volume.py <esp32_ip>

Example:
    python test_pump_water_volume.py 192.168.1.100
"""

import requests
import json
import sys
import time

def test_pump_water_volume(ip_address, pump_duration_seconds=1):
    """
    Test pump water volume dispensed in a given duration.
    
    Args:
        ip_address: ESP32 IP address
        pump_duration_seconds: Duration to run pump (default: 1 second)
    
    Returns:
        dict: Contains pump status, duration, and calculated water volume
    """
    
    base_url = f"http://{ip_address}:8080"
    
    print("\n" + "="*60)
    print("PUMP WATER VOLUME TEST")
    print("="*60)
    print(f"Target: {ip_address}:8080")
    print(f"Duration: {pump_duration_seconds} second(s)")
    print("-"*60)
    
    try:
        # Get initial pump status to check water release rate
        print("\n[1/4] Fetching pump specifications...")
        status_url = f"{base_url}/pump/status"
        response = requests.get(status_url, timeout=5)
        
        if response.status_code != 200:
            print(f"❌ Failed to get pump status. Status code: {response.status_code}")
            return None
        
        status_data = response.json()
        print(f"✓ Pump status: {status_data}")
        
        # Activate pump for specified duration
        print(f"\n[2/4] Activating pump for {pump_duration_seconds} second(s)...")
        activate_url = f"{base_url}/pump/activate"
        
        payload = {
            "duration": pump_duration_seconds
        }
        
        start_time = time.time()
        response = requests.post(
            activate_url,
            json=payload,
            timeout=5
        )
        end_time = time.time()
        request_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        if response.status_code != 200:
            print(f"❌ Failed to activate pump. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return None
        
        activation_data = response.json()
        print(f"✓ Pump activated successfully (took {request_time:.2f}ms)")
        print(f"Response: {activation_data}")
        
        # Wait for pump to complete and get final status
        print(f"\n[3/4] Waiting for pump execution to complete...")
        time.sleep(pump_duration_seconds + 1)  # Add 1 second buffer
        
        response = requests.get(status_url, timeout=5)
        final_status = response.json()
        print(f"✓ Final pump status: {final_status}")
        
        # Calculate water volume
        # NOTE: This assumes the pump has a known water release rate
        # You need to measure or configure the pump's water release rate per second (L/s or mL/s)
        
        print(f"\n[4/4] Calculating water volume...")
        print("-"*60)
        
        # Example: If pump releases 50 mL per second
        # Adjust PUMP_WATER_RELEASE_RATE based on your pump specifications
        PUMP_WATER_RELEASE_RATE_ML_PER_SECOND = 50  # mL/s - ADJUST THIS VALUE
        
        total_water_volume_ml = PUMP_WATER_RELEASE_RATE_ML_PER_SECOND * pump_duration_seconds
        total_water_volume_liters = total_water_volume_ml / 1000
        
        print(f"\n📊 RESULTS:")
        print(f"  Pump Duration:        {pump_duration_seconds} second(s)")
        print(f"  Water Release Rate:   {PUMP_WATER_RELEASE_RATE_ML_PER_SECOND} mL/s")
        print(f"  Total Water Volume:   {total_water_volume_ml:.2f} mL")
        print(f"  Total Water Volume:   {total_water_volume_liters:.4f} L")
        print("-"*60)
        
        result = {
            "success": True,
            "pump_ip": ip_address,
            "duration_seconds": pump_duration_seconds,
            "water_release_rate_ml_per_second": PUMP_WATER_RELEASE_RATE_ML_PER_SECOND,
            "total_water_volume_ml": total_water_volume_ml,
            "total_water_volume_liters": total_water_volume_liters,
            "pump_status": final_status,
            "activation_response": activation_data
        }
        
        print("\n✓ Test completed successfully!")
        print("="*60 + "\n")
        
        return result
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection error: Could not reach {ip_address}:8080")
        print("   Make sure the ESP32 is powered on and connected to the network")
        return None
    except requests.exceptions.Timeout:
        print(f"❌ Timeout: The request took too long")
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return None
    except json.JSONDecodeError:
        print(f"❌ Failed to parse JSON response")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def main():
    """Main function to run the test."""
    
    if len(sys.argv) < 2:
        print("Usage: python test_pump_water_volume.py <esp32_ip> [duration_seconds]")
        print("\nExample:")
        print("  python test_pump_water_volume.py 192.168.1.100")
        print("  python test_pump_water_volume.py 192.168.1.100 2")
        print("\nNote:")
        print("  - Default duration is 1 second")
        print("  - Edit PUMP_WATER_RELEASE_RATE_ML_PER_SECOND in the script to match your pump's rate")
        sys.exit(1)
    
    ip_address = sys.argv[1]
    duration = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    
    result = test_pump_water_volume(ip_address, duration)
    
    if result:
        # Print JSON result for easy parsing
        print("\n📋 JSON Result:")
        print(json.dumps(result, indent=2))
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
