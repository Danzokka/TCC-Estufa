---
applyTo: "**"
---

# Code Review Guidelines - IoT Greenhouse System

## Overview

This IoT Greenhouse System requires specialized code review practices due to its multi-platform architecture (Next.js, NestJS, ESP32, Python AI/ML) and real-time IoT requirements. Reviews must ensure system reliability, security, performance, and proper integration between hardware and software components.

## Review Checklist

### IoT-Specific Security

- **Device Authentication**: Verify ESP32 devices use secure API keys and certificates
- **Data Transmission**: Confirm encrypted communication (HTTPS, WSS, MQTT over TLS)
- **API Security**: Check rate limiting for sensor data endpoints to prevent DoS
- **Input Validation**: Validate all sensor data for range, type, and format correctness
- **Access Control**: Verify role-based permissions for greenhouse operations
- **Credential Management**: Ensure no hardcoded passwords, API keys, or certificates
- **Device Registration**: Check secure device onboarding and deregistration processes

### Real-time Performance

- **WebSocket Efficiency**: Verify efficient real-time data streaming without memory leaks
- **Database Optimization**: Check time-series data queries are properly indexed
- **Sensor Data Processing**: Ensure high-frequency data doesn't overwhelm the system
- **Response Times**: Verify critical alerts and controls respond within acceptable timeframes
- **Memory Management**: Check for proper cleanup of sensor data and WebSocket connections
- **Batch Processing**: Verify efficient handling of bulk sensor data uploads
- **Connection Pooling**: Ensure database connections are properly managed

### Hardware Integration

- **Sensor Calibration**: Verify sensor readings are within expected ranges and properly calibrated
- **Error Handling**: Check graceful handling of sensor failures and communication timeouts
- **Power Management**: Review ESP32 power optimization and sleep mode implementations
- **OTA Updates**: Verify secure and reliable over-the-air firmware update mechanisms
- **Failsafe Mechanisms**: Ensure critical systems have backup plans (watchdog timers, etc.)
- **Hardware Compatibility**: Check code works across different ESP32 variants and sensor types

### Data Integrity & Analytics

- **Data Validation**: Verify sensor readings are validated before storage and processing
- **Time-series Accuracy**: Check timestamp consistency and timezone handling
- **Aggregation Logic**: Verify statistical calculations (averages, trends) are mathematically correct
- **ML Model Integration**: Check AI predictions are properly integrated and validated
- **Data Retention**: Verify proper data archiving and cleanup policies
- **Backup & Recovery**: Ensure critical data has appropriate backup mechanisms

### Automation & Control Systems

- **Safety First**: Verify automation cannot cause dangerous conditions (overwatering, overheating)
- **Threshold Logic**: Check automation trigger conditions are logical and safe
- **Manual Overrides**: Ensure users can always manually override automated systems
- **Audit Logging**: Verify all control actions are properly logged with timestamps and user info
- **Fallback Behavior**: Check system behavior when automation rules conflict or fail
- **Emergency Stops**: Verify emergency shutdown procedures for critical equipment

### Frontend IoT-Specific Checks

- **Real-time Updates**: Verify live data updates don't cause excessive re-renders
- **Offline Handling**: Check graceful degradation when connection to backend is lost
- **Mobile Responsiveness**: Ensure dashboard works well on mobile devices for field use
- **Data Visualization**: Verify charts and graphs accurately represent sensor data
- **Control Confirmations**: Check dangerous actions require user confirmation
- **PWA Features**: Verify push notifications and offline capabilities work correctly

### Backend API Checks

- **Bulk Data Handling**: Verify efficient processing of multiple sensor readings
- **WebSocket Management**: Check proper connection lifecycle management
- **Device Management**: Verify device registration, status tracking, and deregistration
- **Data Aggregation**: Check efficient historical data retrieval and aggregation
- **Alert Processing**: Verify timely processing and delivery of threshold alerts
- **Integration APIs**: Check proper integration with external weather APIs, notification services

### ESP32 Hardware Code

- **Resource Management**: Verify efficient use of memory and processing power
- **Communication Protocols**: Check reliable WiFi, MQTT, and HTTP communication
- **Sensor Libraries**: Verify proper use of sensor libraries and error handling
- **Power Optimization**: Check deep sleep implementation and power saving features
- **Code Structure**: Verify modular, maintainable code with proper function separation
- **Configuration Management**: Check secure storage and retrieval of configuration data

### AI/ML Code Quality

- **Model Performance**: Verify model accuracy metrics meet requirements
- **Data Preprocessing**: Check proper data cleaning and normalization
- **Feature Engineering**: Verify meaningful features are extracted from sensor data
- **Model Updates**: Check mechanisms for retraining and updating models
- **Prediction Validation**: Verify ML predictions are validated before being used for automation
- **Resource Usage**: Check efficient use of computational resources

### Cross-Platform Integration

- **API Consistency**: Verify consistent data formats across all platforms
- **Error Propagation**: Check errors are properly communicated between systems
- **Synchronization**: Verify data consistency across different system components
- **Testing Integration**: Check integration tests cover multi-platform interactions
- **Documentation**: Verify integration points are well documented

### Code Quality Standards

- **TypeScript Usage**: Verify proper typing, no 'any' types without good reason
- **Error Handling**: Check comprehensive error handling with proper logging
- **Code Reusability**: Verify common functions are properly abstracted and reused
- **Documentation**: Check complex IoT logic is well documented with examples
- **Testing Coverage**: Verify adequate test coverage for IoT-specific functionality
- **Naming Conventions**: Check clear, descriptive names for IoT concepts (sensors, actuators, etc.)

### Environmental Considerations

- **Greenhouse Conditions**: Verify code handles extreme temperature/humidity conditions
- **Network Reliability**: Check graceful handling of intermittent network connectivity
- **Scalability**: Verify system can handle multiple greenhouses and hundreds of sensors
- **Maintenance Mode**: Check system behavior during maintenance and updates
- **Seasonal Variations**: Verify system adapts to different growing seasons and conditions

## Review Process

### Priority Levels

1. **Critical**: Security vulnerabilities, safety issues, data corruption risks
2. **High**: Performance issues, hardware integration problems, automation logic errors
3. **Medium**: Code quality, maintainability, testing gaps
4. **Low**: Documentation, minor optimizations, style consistency

### Review Comments Format

```markdown
**[Priority: Critical/High/Medium/Low]**
**Issue**: Brief description of the problem
**Impact**: What could happen if not fixed
**Suggestion**: Specific recommendation for improvement
**Example**: Code example if applicable
```

### IoT-Specific Review Examples

```markdown
**[Priority: Critical]**
**Issue**: Sensor data not validated before triggering automation
**Impact**: Invalid sensor readings could trigger inappropriate actions (e.g., overwatering)
**Suggestion**: Add range validation: `if (soilMoisture < 0 || soilMoisture > 100) return;`

**[Priority: High]**
**Issue**: WebSocket connections not properly cleaned up
**Impact**: Memory leaks and connection limit exhaustion
**Suggestion**: Use `useEffect` cleanup function to close WebSocket connections

**[Priority: Medium]**
**Issue**: Hardcoded sensor thresholds in automation logic
**Impact**: Difficult to adjust thresholds for different plant types
**Suggestion**: Move thresholds to database configuration with plant-specific defaults
```

### Approval Criteria

Before approving a PR, ensure:

- [ ] All security checks pass
- [ ] IoT integration works correctly
- [ ] Real-time features perform adequately
- [ ] Hardware compatibility is maintained
- [ ] Tests cover new IoT functionality
- [ ] Documentation is updated for IoT changes
- [ ] No regression in existing greenhouse operations

### Post-Review Actions

After code review approval:

1. **Integration Testing**: Verify changes work with actual hardware
2. **Performance Monitoring**: Check impact on system performance
3. **User Acceptance**: Validate changes meet greenhouse operator needs
4. **Documentation Updates**: Ensure setup and operation guides are current

This comprehensive review process ensures the IoT Greenhouse System maintains high quality, security, and reliability across all platforms and use cases.
