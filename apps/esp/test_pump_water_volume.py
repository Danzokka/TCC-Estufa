#!/usr/bin/env python3
"""
Test script to control pump water dispensing.

Modes:
  1. By duration: Specify how many seconds to run (pump releases ~30mL/s)
  2. By water volume: Specify how much water you want (in mL), pump calculates duration

Usage:
    python test_pump_water_volume.py <esp32_ip> --duration <seconds>
    python test_pump_water_volume.py <esp32_ip> --water <ml>

Examples:
    python test_pump_water_volume.py 192.168.1.100 --duration 1    # Run for 1 second (~30mL)
    python test_pump_water_volume.py 192.168.1.100 --water 250     # Dispense ~250mL of water
    python test_pump_water_volume.py 192.168.1.100 --status        # Just check status
"""

import requests
import json
import sys
import time
import argparse

# Pump water release rate (mL per second) - matches ESP32 PUMP_ML_PER_SECOND
PUMP_ML_PER_SECOND = 30.0


def get_pump_status(ip_address):
    """Get current pump status."""
    url = f"http://{ip_address}:8080/pump/status"
    response = requests.get(url, timeout=5)
    return response.json() if response.status_code == 200 else None


def activate_pump_by_duration(ip_address, duration_seconds):
    """
    Activate pump for a specific duration.
    
    Args:
        ip_address: ESP32 IP address
        duration_seconds: How many seconds to run the pump
    
    Returns:
        dict: Response from ESP32
    """
    url = f"http://{ip_address}:8080/pump/activate"
    payload = {"duration": duration_seconds}
    
    response = requests.post(url, json=payload, timeout=5)
    return response.json() if response.status_code == 200 else None


def activate_pump_by_water_ml(ip_address, water_ml):
    """
    Activate pump to dispense a specific amount of water.
    ESP32 will calculate the required duration based on PUMP_ML_PER_SECOND.
    
    Args:
        ip_address: ESP32 IP address  
        water_ml: Desired water volume in milliliters
    
    Returns:
        dict: Response from ESP32
    """
    url = f"http://{ip_address}:8080/pump/activate"
    payload = {"water_ml": water_ml}
    
    response = requests.post(url, json=payload, timeout=5)
    return response.json() if response.status_code == 200 else None


def test_pump(ip_address, mode, value):
    """
    Main test function.
    
    Args:
        ip_address: ESP32 IP address
        mode: 'duration', 'water', or 'status'
        value: Duration in seconds or water in mL (ignored for status)
    """
    
    print("\n" + "="*60)
    print("💧 PUMP WATER CONTROL TEST")
    print("="*60)
    print(f"Target: {ip_address}:8080")
    print(f"Mode: {mode}")
    if mode != 'status':
        print(f"Value: {value}")
    print("-"*60)
    
    try:
        # Step 1: Get initial status
        print("\n[1/4] Checking initial pump status...")
        initial_status = get_pump_status(ip_address)
        
        if initial_status is None:
            print("❌ Failed to get pump status")
            return None
        
        print(f"✓ Pump status: {json.dumps(initial_status, indent=2)}")
        
        # Get water rate from ESP32 if available
        water_rate = initial_status.get('water_rate_ml_per_second', PUMP_ML_PER_SECOND)
        print(f"✓ Water rate: {water_rate} mL/s")
        
        if mode == 'status':
            print("\n✓ Status check complete!")
            return initial_status
        
        # Step 2: Calculate and display expectations
        print("\n[2/4] Calculating water volume...")
        
        if mode == 'duration':
            duration_seconds = value
            expected_water_ml = duration_seconds * water_rate
            print(f"  Duration requested: {duration_seconds} seconds")
            print(f"  Expected water: ~{expected_water_ml:.1f} mL (approximate)")
        else:  # mode == 'water'
            expected_water_ml = value
            calculated_duration = value / water_rate
            print(f"  Water requested: {expected_water_ml} mL")
            print(f"  Calculated duration: ~{calculated_duration:.2f} seconds")
            duration_seconds = calculated_duration
        
        # Step 3: Activate pump
        print(f"\n[3/4] Activating pump...")
        start_time = time.time()
        
        if mode == 'duration':
            activation_response = activate_pump_by_duration(ip_address, int(value))
        else:  # mode == 'water'
            activation_response = activate_pump_by_water_ml(ip_address, float(value))
        
        request_time = (time.time() - start_time) * 1000
        
        if activation_response is None:
            print("❌ Failed to activate pump")
            return None
        
        print(f"✓ Pump activated (request took {request_time:.1f}ms)")
        print(f"  Response: {json.dumps(activation_response, indent=2)}")
        
        # Step 4: Wait and get final status
        wait_time = duration_seconds + 1  # Add buffer
        print(f"\n[4/4] Waiting {wait_time:.1f}s for pump to complete...")
        time.sleep(wait_time)
        
        final_status = get_pump_status(ip_address)
        print(f"✓ Final status: {json.dumps(final_status, indent=2)}")
        
        # Display results
        print("\n" + "="*60)
        print("📊 RESULTS")
        print("="*60)
        
        if mode == 'duration':
            print(f"  Mode:                  By Duration")
            print(f"  Duration:              {value} second(s)")
            print(f"  Approx. Water:         ~{expected_water_ml:.1f} mL")
            print(f"  Approx. Water:         ~{expected_water_ml/1000:.4f} L")
        else:
            print(f"  Mode:                  By Water Volume")
            print(f"  Requested Water:       {value} mL")
            print(f"  Calculated Duration:   ~{calculated_duration:.2f} seconds")
        
        print("-"*60)
        print("⚠️  Note: Actual water volume may vary slightly (+/- 10%)")
        print("="*60 + "\n")
        
        return {
            "success": True,
            "mode": mode,
            "value": value,
            "water_rate_ml_per_second": water_rate,
            "expected_water_ml": expected_water_ml,
            "duration_seconds": duration_seconds,
            "initial_status": initial_status,
            "activation_response": activation_response,
            "final_status": final_status
        }
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection error: Could not reach {ip_address}:8080")
        print("   Make sure the ESP32 is powered on and connected to the network")
        return None
    except requests.exceptions.Timeout:
        print("❌ Timeout: The request took too long")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(
        description="Control ESP32 pump water dispensing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s 192.168.1.100 --duration 1     # Run for 1 second (~30mL)
  %(prog)s 192.168.1.100 --duration 5     # Run for 5 seconds (~150mL)
  %(prog)s 192.168.1.100 --water 100      # Dispense ~100mL
  %(prog)s 192.168.1.100 --water 250      # Dispense ~250mL
  %(prog)s 192.168.1.100 --status         # Just check pump status

Water Rate: The pump releases approximately 30 mL per second.
        """
    )
    
    parser.add_argument("ip", help="ESP32 IP address")
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--duration", "-d", type=int, 
                       help="Duration in seconds to run the pump")
    group.add_argument("--water", "-w", type=float,
                       help="Amount of water to dispense in mL")
    group.add_argument("--status", "-s", action="store_true",
                       help="Just check pump status")
    
    args = parser.parse_args()
    
    if args.status:
        result = test_pump(args.ip, 'status', None)
    elif args.duration:
        result = test_pump(args.ip, 'duration', args.duration)
    else:
        result = test_pump(args.ip, 'water', args.water)
    
    if result:
        print("\n📋 Full JSON Result:")
        print(json.dumps(result, indent=2))
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
