#!/usr/bin/env python3
"""
ESP32 Simulator for TCC-Estufa
Simulates sensor readings and pump control for testing without real hardware.

Features:
- Simulates all sensors (temperature, humidity, soil moisture, etc.)
- Responds to pump activation requests
- Sends periodic sensor data to backend
- Realistic environmental changes based on time of day
- Pump activation increases soil moisture
"""

import os
import sys
import json
import time
import random
import threading
import argparse
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any
from flask import Flask, request, jsonify
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
SIMULATOR_PORT = int(os.getenv("SIMULATOR_PORT", "8080"))
GREENHOUSE_ID = os.getenv("GREENHOUSE_ID", "")
DEVICE_IP = os.getenv("DEVICE_IP", "127.0.0.1")
SEND_INTERVAL = int(os.getenv("SEND_INTERVAL", "30"))  # seconds

app = Flask(__name__)


@dataclass
class SimulatorState:
    """Current state of the simulated ESP32"""
    # Environmental sensors
    air_temperature: float = 25.0
    air_humidity: float = 60.0
    soil_temperature: float = 22.0
    soil_moisture: float = 45.0
    
    # Water system
    water_level: float = 80.0
    water_flow: float = 0.0
    
    # Pump state
    pump_active: bool = False
    pump_start_time: Optional[float] = None
    pump_duration_ms: int = 0
    pump_target_volume: float = 0.0
    pump_current_volume: float = 0.0
    
    # Device state
    is_online: bool = True
    uptime_seconds: int = 0
    last_update: Optional[str] = None
    
    # Simulation parameters
    moisture_decay_rate: float = 0.05  # % per minute natural loss
    moisture_per_second_pump: float = 2.0  # % moisture increase per second of pumping
    temp_variation: float = 0.5  # Random temperature variation
    humidity_variation: float = 1.0  # Random humidity variation


# Global state
state = SimulatorState()
state_lock = threading.Lock()
start_time = time.time()


def log(message: str, level: str = "INFO"):
    """Pretty logging"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    icons = {
        "INFO": "ℹ️",
        "PUMP": "💧",
        "SENSOR": "📊",
        "ERROR": "❌",
        "SUCCESS": "✅",
        "WARN": "⚠️"
    }
    icon = icons.get(level, "•")
    print(f"[{timestamp}] {icon} {message}")


def get_time_of_day_factor() -> Dict[str, float]:
    """Get environmental factors based on time of day"""
    hour = datetime.now().hour
    
    # Temperature peaks at 14:00, lowest at 05:00
    if 5 <= hour < 10:
        temp_factor = 0.8 + (hour - 5) * 0.04  # Rising
    elif 10 <= hour < 14:
        temp_factor = 1.0 + (hour - 10) * 0.05  # Peak approaching
    elif 14 <= hour < 20:
        temp_factor = 1.2 - (hour - 14) * 0.05  # Declining
    else:
        temp_factor = 0.7 + random.uniform(-0.05, 0.05)  # Night
    
    # Light intensity based on time
    if 6 <= hour < 8:
        light_factor = (hour - 6) / 2 * 0.5  # Sunrise
    elif 8 <= hour < 17:
        light_factor = 0.5 + 0.5 * (1 - abs(hour - 12.5) / 4.5)  # Day
    elif 17 <= hour < 19:
        light_factor = 0.5 - (hour - 17) / 2 * 0.5  # Sunset
    else:
        light_factor = 0.0  # Night
    
    # Humidity inversely related to temperature
    humidity_factor = 1.3 - temp_factor * 0.3
    
    return {
        "temperature": temp_factor,
        "light": light_factor,
        "humidity": humidity_factor
    }


def update_sensors():
    """Update sensor values with realistic variations"""
    global state
    
    factors = get_time_of_day_factor()
    
    with state_lock:
        # Base values with time-of-day variations
        base_temp = 22.0 + factors["temperature"] * 6
        base_humidity = 50.0 + factors["humidity"] * 20
        
        # Add random noise
        state.air_temperature = base_temp + random.uniform(-state.temp_variation, state.temp_variation)
        state.air_humidity = max(30, min(95, base_humidity + random.uniform(-state.humidity_variation, state.humidity_variation)))
        state.soil_temperature = state.air_temperature - 3 + random.uniform(-0.5, 0.5)
        
        # Natural moisture decay (soil dries over time)
        decay = state.moisture_decay_rate / 60  # Per second
        state.soil_moisture = max(5, state.soil_moisture - decay)
        
        # Water level slowly decreases if pump has been used
        if state.water_level < 100:
            state.water_level = min(100, state.water_level + 0.001)  # Very slow "refill"
        
        # Update timestamp
        state.last_update = datetime.now().isoformat()
        state.uptime_seconds = int(time.time() - start_time)


def process_pump():
    """Process pump state and effects"""
    global state
    
    with state_lock:
        if state.pump_active and state.pump_start_time:
            elapsed_ms = (time.time() - state.pump_start_time) * 1000
            
            if elapsed_ms >= state.pump_duration_ms:
                # Pump finished
                duration_sec = state.pump_duration_ms / 1000
                moisture_increase = duration_sec * state.moisture_per_second_pump
                
                state.soil_moisture = min(100, state.soil_moisture + moisture_increase)
                state.water_level = max(0, state.water_level - (duration_sec * 0.5))  # 0.5L per second
                state.pump_current_volume = duration_sec * 0.05  # ~50ml per second
                
                log(f"Pump finished: {duration_sec:.1f}s, moisture +{moisture_increase:.1f}% → {state.soil_moisture:.1f}%", "PUMP")
                
                state.pump_active = False
                state.pump_start_time = None
                state.water_flow = 0.0
            else:
                # Pump still running
                state.water_flow = 50.0  # ml/s during pumping
                remaining = (state.pump_duration_ms - elapsed_ms) / 1000
                if int(elapsed_ms) % 500 == 0:  # Log every 500ms
                    log(f"Pump running... {remaining:.1f}s remaining", "PUMP")


def send_data_to_backend():
    """Send current sensor data to backend"""
    global state
    
    if not GREENHOUSE_ID:
        log("No GREENHOUSE_ID configured, skipping data send", "WARN")
        return False
    
    with state_lock:
        payload = {
            "greenhouseId": GREENHOUSE_ID,
            "air_temperature": round(state.air_temperature, 2),
            "air_humidity": round(state.air_humidity, 2),
            "soil_temperature": round(state.soil_temperature, 2),
            "soil_moisture": round(state.soil_moisture, 2),
        }
    
    try:
        url = f"{BACKEND_URL}/sensor"
        response = requests.post(url, json=payload, timeout=5)
        
        if response.status_code in [200, 201]:
            log(f"Data sent: T={payload['air_temperature']}°C, H={payload['air_humidity']}%, SM={payload['soil_moisture']}%", "SENSOR")
            return True
        else:
            log(f"Backend returned {response.status_code}: {response.text[:100]}", "ERROR")
            return False
    except requests.exceptions.ConnectionError:
        log(f"Cannot connect to backend at {BACKEND_URL}", "ERROR")
        return False
    except Exception as e:
        log(f"Error sending data: {e}", "ERROR")
        return False


# ============== Flask Endpoints (ESP32 API) ==============

@app.route('/status', methods=['GET'])
def get_status():
    """Get device status"""
    with state_lock:
        return jsonify({
            "device": "ESP32-Simulator",
            "version": "1.0.0",
            "uptime": state.uptime_seconds,
            "is_online": state.is_online,
            "greenhouse_id": GREENHOUSE_ID,
            "ip": DEVICE_IP,
            "timestamp": state.last_update
        })


@app.route('/sensors', methods=['GET'])
def get_sensors():
    """Get all sensor readings"""
    with state_lock:
        return jsonify({
            "air_temperature": round(state.air_temperature, 2),
            "air_humidity": round(state.air_humidity, 2),
            "soil_temperature": round(state.soil_temperature, 2),
            "soil_moisture": round(state.soil_moisture, 2),
            "water_level": round(state.water_level, 2),
            "water_flow": round(state.water_flow, 2),
            "timestamp": state.last_update
        })


@app.route('/pump/status', methods=['GET'])
def get_pump_status():
    """Get pump status"""
    with state_lock:
        remaining_ms = 0
        if state.pump_active and state.pump_start_time:
            elapsed = (time.time() - state.pump_start_time) * 1000
            remaining_ms = max(0, state.pump_duration_ms - elapsed)
        
        return jsonify({
            "status": "on" if state.pump_active else "off",
            "is_active": state.pump_active,
            "remaining_seconds": remaining_ms / 1000,
            "remaining_ms": remaining_ms,
            "target_volume": state.pump_target_volume,
            "current_volume": state.pump_current_volume,
            "water_flow": state.water_flow,
            "start_time": datetime.fromtimestamp(state.pump_start_time).isoformat() if state.pump_start_time else None
        })


@app.route('/pump/activate', methods=['POST'])
def activate_pump():
    """Activate the pump"""
    global state
    
    data = request.get_json() or {}
    
    # Support multiple parameter formats
    duration_ms = data.get('duration_ms') or data.get('duration', 0) * 1000
    volume = data.get('volume', 0)
    
    if duration_ms <= 0 and volume <= 0:
        return jsonify({"error": "duration_ms or volume required"}), 400
    
    # If volume specified, calculate duration (50ml/s = 50ml per 1000ms)
    if volume > 0 and duration_ms <= 0:
        duration_ms = volume / 0.05 * 1000  # 50ml per second
    
    with state_lock:
        if state.pump_active:
            return jsonify({"error": "Pump already active"}), 409
        
        state.pump_active = True
        state.pump_start_time = time.time()
        state.pump_duration_ms = int(duration_ms)
        state.pump_target_volume = volume if volume > 0 else (duration_ms / 1000) * 0.05
        state.pump_current_volume = 0
        state.water_flow = 50.0
        
        log(f"Pump ACTIVATED for {duration_ms}ms ({duration_ms/1000:.1f}s)", "PUMP")
    
    return jsonify({
        "success": True,
        "message": f"Pump activated for {duration_ms}ms",
        "duration_ms": duration_ms,
        "estimated_volume": state.pump_target_volume
    })


@app.route('/pump/stop', methods=['POST'])
def stop_pump():
    """Emergency stop pump"""
    global state
    
    with state_lock:
        was_active = state.pump_active
        
        if state.pump_active and state.pump_start_time:
            elapsed = time.time() - state.pump_start_time
            moisture_increase = elapsed * state.moisture_per_second_pump
            state.soil_moisture = min(100, state.soil_moisture + moisture_increase)
        
        state.pump_active = False
        state.pump_start_time = None
        state.pump_duration_ms = 0
        state.water_flow = 0.0
        
        log("Pump STOPPED" + (" (was active)" if was_active else " (was idle)"), "PUMP")
    
    return jsonify({
        "success": True,
        "message": "Pump stopped",
        "was_active": was_active
    })


# ============== Simulation Control Endpoints ==============

@app.route('/sim/state', methods=['GET'])
def get_sim_state():
    """Get full simulator state"""
    with state_lock:
        return jsonify(asdict(state))


@app.route('/sim/reset', methods=['POST'])
def reset_state():
    """Reset simulator to default state"""
    global state
    
    with state_lock:
        state = SimulatorState()
        state.last_update = datetime.now().isoformat()
    
    log("Simulator state RESET to defaults", "SUCCESS")
    return jsonify({"success": True, "message": "State reset to defaults"})


@app.route('/sim/set', methods=['POST'])
def set_state():
    """Set specific state values"""
    global state
    
    data = request.get_json() or {}
    
    with state_lock:
        for key, value in data.items():
            if hasattr(state, key):
                setattr(state, key, value)
                log(f"Set {key} = {value}", "INFO")
    
    return jsonify({"success": True, "state": asdict(state)})


@app.route('/sim/scenario', methods=['POST'])
def run_scenario():
    """Run a predefined scenario"""
    global state
    
    data = request.get_json() or {}
    scenario = data.get('scenario', 'default')
    
    scenarios = {
        'dry': {
            'soil_moisture': 15,
            'air_temperature': 32,
            'air_humidity': 40,
            'water_level': 70
        },
        'wet': {
            'soil_moisture': 85,
            'air_temperature': 22,
            'air_humidity': 80,
            'water_level': 90
        },
        'hot': {
            'soil_moisture': 30,
            'air_temperature': 38,
            'air_humidity': 35
        },
        'cold': {
            'soil_moisture': 50,
            'air_temperature': 12,
            'air_humidity': 70
        },
        'optimal': {
            'soil_moisture': 65,
            'air_temperature': 25,
            'air_humidity': 60,
            'water_level': 85
        },
        'low_water': {
            'soil_moisture': 40,
            'water_level': 10
        },
        'night': {
            'air_temperature': 18,
            'air_humidity': 75
        }
    }
    
    if scenario not in scenarios:
        return jsonify({
            "error": f"Unknown scenario: {scenario}",
            "available": list(scenarios.keys())
        }), 400
    
    with state_lock:
        for key, value in scenarios[scenario].items():
            setattr(state, key, value)
    
    log(f"Applied scenario: {scenario}", "SUCCESS")
    return jsonify({
        "success": True,
        "scenario": scenario,
        "values": scenarios[scenario]
    })


# ============== Background Tasks ==============

def sensor_update_loop():
    """Background loop to update sensors"""
    while True:
        update_sensors()
        process_pump()
        time.sleep(1)


def data_send_loop():
    """Background loop to send data to backend"""
    time.sleep(5)  # Initial delay
    while True:
        send_data_to_backend()
        time.sleep(SEND_INTERVAL)


def print_status_loop():
    """Print periodic status to console"""
    while True:
        time.sleep(30)
        with state_lock:
            log(f"Status: T={state.air_temperature:.1f}°C, H={state.air_humidity:.0f}%, SM={state.soil_moisture:.1f}%, Water={state.water_level:.0f}%", "SENSOR")


# ============== Main ==============

def main():
    global BACKEND_URL, GREENHOUSE_ID, SEND_INTERVAL
    
    parser = argparse.ArgumentParser(description='ESP32 Simulator for TCC-Estufa')
    parser.add_argument('--port', type=int, default=SIMULATOR_PORT, help='HTTP server port')
    parser.add_argument('--backend', type=str, default=BACKEND_URL, help='Backend URL')
    parser.add_argument('--greenhouse', type=str, default=GREENHOUSE_ID, help='Greenhouse ID')
    parser.add_argument('--interval', type=int, default=SEND_INTERVAL, help='Data send interval (seconds)')
    parser.add_argument('--no-send', action='store_true', help='Disable sending data to backend')
    parser.add_argument('--scenario', type=str, help='Start with a scenario (dry, wet, hot, cold, optimal)')
    
    args = parser.parse_args()
    
    BACKEND_URL = args.backend
    GREENHOUSE_ID = args.greenhouse
    SEND_INTERVAL = args.interval
    
    print("\n" + "="*60)
    print("🌿 ESP32 SIMULATOR - TCC Estufa Inteligente")
    print("="*60)
    print(f"  📡 Server:     http://localhost:{args.port}")
    print(f"  🔗 Backend:    {BACKEND_URL}")
    print(f"  🏠 Greenhouse: {GREENHOUSE_ID or '(not configured)'}")
    print(f"  ⏱️  Interval:   {SEND_INTERVAL}s")
    print(f"  📤 Sending:    {'Disabled' if args.no_send else 'Enabled'}")
    print("="*60)
    print("\n📌 Endpoints:")
    print(f"  GET  http://localhost:{args.port}/status")
    print(f"  GET  http://localhost:{args.port}/sensors")
    print(f"  GET  http://localhost:{args.port}/pump/status")
    print(f"  POST http://localhost:{args.port}/pump/activate")
    print(f"  POST http://localhost:{args.port}/pump/stop")
    print(f"\n🎮 Simulation Control:")
    print(f"  GET  http://localhost:{args.port}/sim/state")
    print(f"  POST http://localhost:{args.port}/sim/reset")
    print(f"  POST http://localhost:{args.port}/sim/set")
    print(f"  POST http://localhost:{args.port}/sim/scenario")
    print("="*60 + "\n")
    
    # Apply initial scenario if specified
    if args.scenario:
        with app.test_client() as client:
            client.post('/sim/scenario', json={'scenario': args.scenario})
    
    # Start background threads
    threading.Thread(target=sensor_update_loop, daemon=True).start()
    threading.Thread(target=print_status_loop, daemon=True).start()
    
    if not args.no_send and GREENHOUSE_ID:
        threading.Thread(target=data_send_loop, daemon=True).start()
        log(f"Data sending enabled (every {SEND_INTERVAL}s)", "SUCCESS")
    else:
        log("Data sending disabled", "WARN")
    
    log("Simulator started!", "SUCCESS")
    
    # Run Flask server
    app.run(host='0.0.0.0', port=args.port, debug=False, threaded=True)


if __name__ == '__main__':
    main()
