---
applyTo: "**"
---

# Commit Message Guidelines - IoT Greenhouse System

## Conventional Commits Format

Use the Conventional Commits specification for all commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

- **feat**: new feature for the user
- **fix**: bug fix for the user
- **docs**: changes to documentation
- **style**: formatting, missing semicolons, etc (no code change)
- **refactor**: refactoring production code, no new functionality
- **perf**: code changes that improve performance
- **test**: adding missing tests, refactoring tests
- **chore**: updating build tasks, package manager configs, etc
- **ci**: changes to CI configuration files and scripts
- **build**: changes that affect the build system or external dependencies
- **security**: security-related changes
- **hw**: hardware-related changes (ESP32, sensors, actuators)

## IoT-Specific Scopes

### Platform Scopes

- **web**: frontend/Next.js changes
- **api**: backend/NestJS changes
- **esp32**: ESP32 firmware changes
- **ai**: AI/ML Python service changes

### Feature Scopes

- **sensor**: sensor data collection and processing
- **actuator**: actuator control and automation
- **dashboard**: real-time monitoring dashboard
- **automation**: automation rules and triggers
- **device**: device management and communication
- **greenhouse**: greenhouse-specific functionality
- **plant**: plant monitoring and management
- **alert**: alert system and notifications
- **websocket**: real-time communication
- **mqtt**: MQTT broker and messaging
- **auth**: authentication and authorization
- **db**: database/Prisma changes
- **docker**: containerization changes
- **ci**: CI/CD pipeline changes
- **deps**: dependency updates
- **config**: configuration changes

## IoT Commit Message Examples

### Feature Additions

```
feat(sensor): add soil moisture sensor integration
feat(dashboard): implement real-time temperature charts
feat(automation): add threshold-based watering automation
feat(esp32): add deep sleep power management
feat(ai): implement LSTM model for environmental prediction
feat(websocket): add real-time sensor data streaming
feat(device): add ESP32 device registration and authentication
```

### Bug Fixes

```
fix(sensor): resolve temperature reading calibration issues
fix(automation): prevent water pump from running continuously
fix(websocket): fix connection drops during high data load
fix(esp32): resolve WiFi reconnection timeout issues
fix(dashboard): fix chart rendering with missing data points
fix(api): fix sensor data validation for edge cases
```

### Performance Improvements

```
perf(sensor): optimize bulk sensor data processing
perf(dashboard): reduce WebSocket message frequency
perf(esp32): improve power consumption in deep sleep mode
perf(ai): optimize model inference speed
perf(db): add indexes for time-series sensor data queries
```

### Hardware-Specific Changes

```
hw(esp32): add support for new DHT22 sensor
hw(actuator): implement servo motor control for greenhouse vents
hw(sensor): add calibration procedure for pH sensors
hw(esp32): add watchdog timer for system reliability
hw(device): implement OTA firmware update mechanism
```

### Security Updates

```
security(api): add rate limiting for sensor data endpoints
security(device): implement device API key authentication
security(esp32): add encrypted communication for sensitive data
security(auth): implement role-based access control for greenhouse operations
```

### Testing

```
test(sensor): add unit tests for sensor data validation
test(automation): add integration tests for watering automation
test(websocket): add load tests for real-time data streaming
test(esp32): add hardware-in-the-loop tests for sensor readings
test(ai): add performance tests for ML model predictions
```

### Documentation

```
docs(api): update sensor data API documentation
docs(esp32): add sensor wiring and setup instructions
docs(automation): document automation rule configuration
docs(deployment): add Docker deployment guide
docs(troubleshooting): add common ESP32 connectivity issues
```

### Configuration and Maintenance

```
chore(deps): update TensorFlow to latest stable version
chore(config): update default sensor thresholds for winter season
chore(esp32): update PlatformIO platform to latest version
chore(docker): optimize container image sizes
chore(db): add database migration for new sensor types
```

### CI/CD Changes

```
ci: add ESP32 firmware compilation to pipeline
ci: implement integration tests for device communication
ci: add performance testing for real-time features
ci: add security scanning for IoT vulnerabilities
ci: implement blue-green deployment for zero downtime
```

## Breaking Changes

When introducing breaking changes, especially important for IoT systems:

```
feat(api): change sensor data payload format

BREAKING CHANGE: sensor data now requires deviceId field and timestamp in ISO format

Migration guide:
- Update ESP32 firmware to include deviceId in payload
- Ensure all timestamps are sent in ISO 8601 format
- Update any custom integrations to handle new format

Closes #456
```

## Hardware-Specific Breaking Changes

```
hw(esp32): change sensor pin assignments

BREAKING CHANGE: DHT22 sensor moved from pin 4 to pin 2

Hardware changes required:
- Rewire DHT22 sensor to pin 2
- Update firmware configuration
- Recalibrate sensor readings after hardware change

Affects: All greenhouse installations with DHT22 sensors
```

## Multi-line Body Examples

### Feature Implementation

```
feat(automation): implement smart irrigation system

Add intelligent watering automation based on:
- Soil moisture sensor readings
- Weather forecast integration
- Plant-specific watering requirements
- Time-based scheduling with manual overrides

Features:
- Configurable moisture thresholds per plant type
- Weather-aware scheduling (skip watering if rain expected)
- Manual emergency stop and override capabilities
- Audit logging for all watering events

Closes #234
```

### Bug Fix with Analysis

```
fix(sensor): resolve intermittent temperature sensor failures

Fixed issue where DHT22 sensors would return -999°C readings
sporadically, causing false alerts and automation failures.

Root cause:
- Insufficient delay between sensor readings
- Power supply fluctuations during WiFi transmission
- Inadequate error handling for sensor timeouts

Solution:
- Increased reading interval from 1s to 2s
- Added power supply stabilization capacitor
- Implemented retry logic with exponential backoff
- Added sensor health monitoring and alerts

Tested with 5 greenhouse installations over 48 hours
with no failures observed.

Fixes #567
```

### Performance Optimization

```
perf(dashboard): optimize real-time chart updates

Improved dashboard performance for greenhouses with 50+ sensors:

Optimizations:
- Implement data point aggregation for historical views
- Use canvas-based rendering for large datasets
- Add virtual scrolling for sensor lists
- Implement selective WebSocket subscriptions

Results:
- 70% reduction in memory usage
- 50% improvement in chart rendering speed
- Eliminated UI freezing during data bursts
- Better mobile device performance

Benchmark results included in performance-test-results.md

Closes #345
```

## Commit Message Validation

### Good Examples ✅

```
feat(sensor): add support for multiple temperature sensors per greenhouse
fix(automation): prevent overlapping watering schedules
perf(websocket): reduce memory usage during high-frequency updates
docs(api): add examples for bulk sensor data endpoints
test(esp32): add unit tests for MQTT connection handling
```

### Bad Examples ❌

```
updated sensor code (too vague, no type/scope)
Fix bug (not descriptive enough)
Added new feature for temperature (missing scope, not imperative)
feat: various improvements (not specific)
sensor: fixed issue (wrong type, not descriptive)
```

## Integration with Issues and PRs

### Linking Issues

```
feat(automation): add plant-specific watering schedules

Closes #123
Fixes #456
Resolves #789
```

### Pull Request Integration

```
feat(dashboard): implement mobile-responsive sensor grid

This commit is part of the mobile optimization initiative.
Full changes documented in PR #345.

Related: #234, #567
```

## Emergency Fixes

For critical production issues:

```
hotfix(sensor): fix critical temperature sensor data corruption

URGENT: Temperature sensors reporting incorrect values causing
automation failures and potential plant damage.

Immediate fix:
- Added input validation for sensor readings
- Implemented fallback to last known good value
- Added critical alert for sensor anomalies

Production deployment required immediately.

Fixes #CRITICAL-001
```

This commit message format ensures clear communication about changes in the complex IoT greenhouse system, making it easier to track issues, coordinate deployments, and maintain the system across multiple platforms.
