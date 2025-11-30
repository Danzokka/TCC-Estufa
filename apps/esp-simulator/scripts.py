#!/usr/bin/env python3
"""
Utility scripts to control the ESP32 simulator
Run with: python scripts.py <command> [args]
"""

import sys
import requests
import argparse
import json

SIMULATOR_URL = "http://localhost:8080"


def print_json(data):
    """Pretty print JSON"""
    print(json.dumps(data, indent=2))


def cmd_status(args):
    """Get simulator status"""
    r = requests.get(f"{SIMULATOR_URL}/status")
    print("📡 Device Status:")
    print_json(r.json())
    
    r = requests.get(f"{SIMULATOR_URL}/sensors")
    print("\n📊 Sensors:")
    print_json(r.json())
    
    r = requests.get(f"{SIMULATOR_URL}/pump/status")
    print("\n💧 Pump:")
    print_json(r.json())


def cmd_sensors(args):
    """Get sensor readings"""
    r = requests.get(f"{SIMULATOR_URL}/sensors")
    print_json(r.json())


def cmd_pump_status(args):
    """Get pump status"""
    r = requests.get(f"{SIMULATOR_URL}/pump/status")
    print_json(r.json())


def cmd_pump_on(args):
    """Activate pump"""
    duration_ms = args.duration * 1000
    r = requests.post(f"{SIMULATOR_URL}/pump/activate", json={"duration_ms": duration_ms})
    print(f"💧 Pump activated for {args.duration}s")
    print_json(r.json())


def cmd_pump_off(args):
    """Stop pump"""
    r = requests.post(f"{SIMULATOR_URL}/pump/stop")
    print("🛑 Pump stopped")
    print_json(r.json())


def cmd_reset(args):
    """Reset simulator state"""
    r = requests.post(f"{SIMULATOR_URL}/sim/reset")
    print("🔄 Simulator reset!")
    print_json(r.json())


def cmd_set(args):
    """Set a specific value"""
    data = {args.key: args.value}
    r = requests.post(f"{SIMULATOR_URL}/sim/set", json=data)
    print(f"✅ Set {args.key} = {args.value}")


def cmd_scenario(args):
    """Apply a scenario"""
    r = requests.post(f"{SIMULATOR_URL}/sim/scenario", json={"scenario": args.name})
    if r.status_code == 200:
        print(f"🎭 Applied scenario: {args.name}")
        print_json(r.json())
    else:
        print(f"❌ Error: {r.json()}")


def cmd_dry(args):
    """Set dry soil conditions (for testing irrigation)"""
    r = requests.post(f"{SIMULATOR_URL}/sim/set", json={"soil_moisture": args.moisture})
    print(f"🏜️ Set soil moisture to {args.moisture}% (dry conditions)")


def cmd_wet(args):
    """Set wet soil conditions"""
    r = requests.post(f"{SIMULATOR_URL}/sim/set", json={"soil_moisture": args.moisture})
    print(f"💦 Set soil moisture to {args.moisture}% (wet conditions)")


def cmd_state(args):
    """Get full simulator state"""
    r = requests.get(f"{SIMULATOR_URL}/sim/state")
    print("📋 Full Simulator State:")
    print_json(r.json())


def cmd_watch(args):
    """Watch sensor values in real-time"""
    import time
    
    print("👁️ Watching sensors (Ctrl+C to stop)...")
    print("-" * 60)
    
    try:
        while True:
            r = requests.get(f"{SIMULATOR_URL}/sensors")
            data = r.json()
            
            pump = requests.get(f"{SIMULATOR_URL}/pump/status").json()
            pump_status = "🟢 ON" if pump.get('is_active') else "⚪ OFF"
            
            print(f"\r🌡️ {data['air_temperature']:.1f}°C | "
                  f"💧 {data['air_humidity']:.0f}% | "
                  f"🌱 SM: {data['soil_moisture']:.1f}% | "
                  f"🚰 {data['water_level']:.0f}% | "
                  f"Pump: {pump_status}    ", end="")
            
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n👋 Stopped watching")


def main():
    parser = argparse.ArgumentParser(description='ESP32 Simulator Control Scripts')
    parser.add_argument('--url', default=SIMULATOR_URL, help='Simulator URL')
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Status commands
    subparsers.add_parser('status', help='Get full status')
    subparsers.add_parser('sensors', help='Get sensor readings')
    subparsers.add_parser('pump-status', help='Get pump status')
    subparsers.add_parser('state', help='Get full simulator state')
    subparsers.add_parser('watch', help='Watch sensors in real-time')
    
    # Pump commands
    pump_on = subparsers.add_parser('pump-on', help='Activate pump')
    pump_on.add_argument('duration', type=float, default=1.0, nargs='?', help='Duration in seconds')
    
    subparsers.add_parser('pump-off', help='Stop pump')
    
    # Simulation commands
    subparsers.add_parser('reset', help='Reset simulator to defaults')
    
    set_cmd = subparsers.add_parser('set', help='Set a specific value')
    set_cmd.add_argument('key', help='State key (e.g., soil_moisture)')
    set_cmd.add_argument('value', type=float, help='Value to set')
    
    scenario_cmd = subparsers.add_parser('scenario', help='Apply a scenario')
    scenario_cmd.add_argument('name', choices=['dry', 'wet', 'hot', 'cold', 'optimal', 'low_water', 'night'],
                              help='Scenario name')
    
    dry_cmd = subparsers.add_parser('dry', help='Set dry soil (shortcut)')
    dry_cmd.add_argument('moisture', type=float, default=15, nargs='?', help='Moisture level')
    
    wet_cmd = subparsers.add_parser('wet', help='Set wet soil (shortcut)')
    wet_cmd.add_argument('moisture', type=float, default=85, nargs='?', help='Moisture level')
    
    args = parser.parse_args()
    
    global SIMULATOR_URL
    SIMULATOR_URL = args.url
    
    if not args.command:
        parser.print_help()
        return
    
    # Map commands to functions
    commands = {
        'status': cmd_status,
        'sensors': cmd_sensors,
        'pump-status': cmd_pump_status,
        'pump-on': cmd_pump_on,
        'pump-off': cmd_pump_off,
        'reset': cmd_reset,
        'set': cmd_set,
        'scenario': cmd_scenario,
        'dry': cmd_dry,
        'wet': cmd_wet,
        'state': cmd_state,
        'watch': cmd_watch,
    }
    
    try:
        commands[args.command](args)
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to simulator at {SIMULATOR_URL}")
        print("   Make sure the simulator is running: python simulator.py")
        sys.exit(1)


if __name__ == '__main__':
    main()
