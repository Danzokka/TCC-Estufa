---
applyTo: "**"
---

# Pull Request Guidelines - IoT Greenhouse System

## PR Title Format

Follow conventional commit format:

```
<type>[scope]: <brief description>
```

Examples:

- `feat(sensor): add soil moisture monitoring dashboard`
- `fix(esp32): resolve WiFi connection timeout issues`
- `perf(websocket): optimize real-time data streaming`

## PR Description Template

### 🎯 Objective

Clear statement of what this PR accomplishes and why it's needed for the IoT greenhouse system.

### 📋 Type of Change

- [ ] New IoT feature (sensor integration, automation, etc.)
- [ ] Bug fix (sensor, connectivity, or system issue)
- [ ] Hardware change (ESP32 firmware, sensor setup)
- [ ] AI/ML improvement (model training, prediction accuracy)
- [ ] Breaking change (affects existing greenhouse operations)
- [ ] Performance improvement (real-time processing, power optimization)
- [ ] Security enhancement (device authentication, data encryption)
- [ ] Documentation update
- [ ] Configuration change
- [ ] Refactoring (no functional changes)

### ✨ Changes Made

#### Frontend (Next.js/React)

- [ ] Dashboard: [Component/Feature] - [Description]
- [ ] Real-time updates: [WebSocket/Chart changes]
- [ ] Mobile optimization: [PWA/Responsive changes]
- [ ] Control interface: [Actuator controls/Automation UI]
- [ ] Data visualization: [Charts/Analytics]

#### Backend (NestJS)

- [ ] Sensor API: [Endpoint changes] - [Description]
- [ ] Device management: [Registration/Authentication]
- [ ] WebSocket: [Real-time communication changes]
- [ ] Automation: [Rule engine/Trigger changes]
- [ ] Database: [Schema/Migration changes]
- [ ] MQTT: [Device communication changes]

#### ESP32 Firmware

- [ ] Sensor integration: [New sensors/Calibration]
- [ ] Communication: [WiFi/MQTT/HTTP changes]
- [ ] Power management: [Sleep modes/Optimization]
- [ ] OTA updates: [Firmware deployment]
- [ ] Error handling: [Watchdog/Recovery]

#### AI/ML (Python)

- [ ] Model training: [Algorithm/Data changes]
- [ ] Prediction accuracy: [Performance improvements]
- [ ] Data processing: [Pipeline/Preprocessing]
- [ ] Integration: [API/Real-time predictions]

#### Infrastructure

- [ ] Docker: [Container changes]
- [ ] CI/CD: [Pipeline changes for multi-platform builds]
- [ ] Monitoring: [IoT-specific observability]
- [ ] Security: [Device/API security]

### 🧪 Testing

#### Unit Tests

- [ ] Sensor data validation tests
- [ ] Automation rule logic tests
- [ ] API endpoint tests
- [ ] ESP32 function tests
- [ ] AI/ML model tests

#### Integration Tests

- [ ] Device communication tests
- [ ] Real-time data flow tests
- [ ] Automation execution tests
- [ ] Cross-platform integration tests

#### Hardware Tests

- [ ] Sensor reading accuracy tests
- [ ] Communication reliability tests
- [ ] Power consumption tests
- [ ] Environmental condition tests

#### End-to-End Tests

- [ ] Complete automation workflows
- [ ] Dashboard real-time updates
- [ ] Mobile device functionality
- [ ] Emergency scenarios

### 📊 Performance Impact

#### System Performance

- Real-time data processing: [improved/degraded/neutral]
- Database query performance: [impact assessment]
- WebSocket connection efficiency: [impact assessment]
- Memory usage: [ESP32/Server impact]

#### Hardware Performance

- ESP32 power consumption: [impact assessment]
- Sensor reading frequency: [changes made]
- Communication latency: [impact assessment]
- Firmware size: [increased/decreased by amount]

#### Network Performance

- Data transmission frequency: [impact assessment]
- MQTT message size: [optimization/changes]
- API response times: [impact assessment]

### 🔒 Security Considerations

#### Device Security

- [ ] ESP32 device authentication verified
- [ ] Secure API key management
- [ ] Encrypted communication channels
- [ ] Device firmware integrity checks

#### Data Security

- [ ] Sensor data validation and sanitization
- [ ] Secure data transmission (HTTPS/WSS/MQTT-TLS)
- [ ] Access control for greenhouse operations
- [ ] Audit logging for critical actions

#### API Security

- [ ] Rate limiting for sensor endpoints
- [ ] Input validation for all IoT data
- [ ] Authentication for device registration
- [ ] Authorization for control commands

### 🌱 Greenhouse Impact

#### Operational Impact

- [ ] Affects existing greenhouse operations
- [ ] Requires sensor recalibration
- [ ] Changes automation behavior
- [ ] Impacts plant monitoring accuracy

#### Compatibility

- [ ] Backward compatible with existing sensors
- [ ] Works with current greenhouse configurations
- [ ] Maintains existing automation rules
- [ ] Compatible with mobile interfaces

### 📱 Mobile/IoT Interface

- [ ] Mobile-responsive dashboard updates
- [ ] PWA functionality for offline access
- [ ] Touch-friendly control interfaces
- [ ] Real-time notifications tested
- [ ] Cross-platform compatibility verified

### 🚨 Breaking Changes

List any breaking changes and migration steps required:

#### Hardware Changes

- Sensor wiring modifications required
- ESP32 firmware updates needed
- Calibration procedures changed

#### Software Changes

- API contract modifications
- Database schema updates
- Configuration file changes

#### Migration Steps

1. [Step-by-step migration instructions]
2. [Rollback procedures if needed]
3. [Testing verification steps]

### 📝 Environment Variables

List any new environment variables or configuration changes:

```bash
# Sensor configuration
SENSOR_CALIBRATION_INTERVAL=3600 # Calibration check every hour
SENSOR_ERROR_THRESHOLD=5 # Max consecutive errors before alert

# Device management
DEVICE_REGISTRATION_TIMEOUT=30000 # Device registration timeout
OTA_UPDATE_INTERVAL=86400 # OTA update check daily

# Automation settings
AUTOMATION_SAFETY_TIMEOUT=300 # Safety timeout for automation actions
EMERGENCY_STOP_ENABLED=true # Enable emergency stop functionality
```

### 🗃️ Database Changes

- [ ] Migration files included for sensor data
- [ ] Time-series data optimization
- [ ] Indexes added for performance
- [ ] Backward compatibility maintained
- [ ] Data retention policies updated

### 🔧 Hardware Requirements

#### New Hardware

- [ ] Additional sensors required
- [ ] ESP32 board changes needed
- [ ] Actuator modifications
- [ ] Power supply changes

#### Wiring Changes

- [ ] Sensor pin assignments modified
- [ ] New connections required
- [ ] Safety considerations addressed

### 🤖 AI/ML Changes

- [ ] Model architecture updates
- [ ] Training data requirements
- [ ] Prediction accuracy improvements
- [ ] Real-time inference optimizations
- [ ] Integration with automation system

### 🔗 Related Issues

- Closes #[issue-number]
- Relates to #[issue-number]
- Fixes #[issue-number]
- Implements #[feature-request-number]

### 🖼️ Screenshots/Videos

Include screenshots for:

- Dashboard changes
- Mobile interface updates
- Sensor data visualizations
- Control interface modifications

Include videos for:

- Automation workflows
- Real-time data updates
- Hardware demonstrations
- Mobile app functionality

### ✅ Deployment Checklist

#### Pre-deployment

- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Dependencies updated across all platforms
- [ ] ESP32 firmware compiled and tested
- [ ] AI/ML models validated

#### Hardware Deployment

- [ ] ESP32 firmware OTA update prepared
- [ ] Sensor calibration procedures documented
- [ ] Hardware compatibility verified
- [ ] Emergency procedures documented

#### Software Deployment

- [ ] API changes backward compatible
- [ ] Real-time features tested under load
- [ ] Mobile app updates deployed
- [ ] Monitoring/alerting configured

#### Post-deployment

- [ ] System health checks completed
- [ ] Device connectivity verified
- [ ] Automation rules tested
- [ ] Performance monitoring active

### 👀 Review Notes

#### Focus Areas for Reviewers

- IoT security implications
- Real-time performance impact
- Hardware integration correctness
- Automation safety considerations
- Mobile user experience
- Data integrity and validation

#### Specific Concerns

- [Any specific areas of concern]
- [Performance bottlenecks to watch]
- [Security considerations to validate]
- [Hardware compatibility issues]

### 🧪 Manual Testing Checklist

#### Greenhouse Operations

- [ ] Sensor readings accurate and consistent
- [ ] Automation rules trigger correctly
- [ ] Manual controls respond appropriately
- [ ] Emergency stop functionality works
- [ ] Mobile interface fully functional

#### Edge Cases

- [ ] Network connectivity loss handling
- [ ] Sensor failure scenarios
- [ ] Power outage recovery
- [ ] Extreme environmental conditions
- [ ] High data load scenarios

### 📊 Metrics to Monitor

After deployment, monitor:

- Sensor data accuracy and consistency
- Automation execution success rate
- System response times
- Device connectivity stability
- Power consumption patterns
- User engagement with new features

## Requirements for PR Generation

### Essential Requirements

- Always link related issues and feature requests
- Include comprehensive testing across all platforms
- Document all breaking changes with migration steps
- Provide clear deployment instructions for all components
- Include performance and security impact assessments
- Add screenshots/videos for UI and hardware changes
- Document hardware requirements and compatibility
- Include environment variable and configuration changes

### IoT-Specific Requirements

- Verify sensor data accuracy and validation
- Test automation safety and emergency procedures
- Validate real-time performance under load
- Ensure mobile interface works offline
- Confirm device authentication and security
- Test OTA update mechanisms
- Validate cross-platform integration
- Document calibration and maintenance procedures

This comprehensive PR template ensures all aspects of the IoT greenhouse system are properly reviewed and deployed safely.
