---
applyTo: "**"
---

# GitHub Copilot Memory Instructions - IoT Greenhouse System

Your documentation is on [memory_mcp](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)

## System Overview

This is an IoT Greenhouse Monitoring and Control System built with a multi-technology stack: Next.js (web frontend), NestJS (API backend), ESP32 (hardware sensors/actuators), and Python AI/ML (data analysis and predictions). The system provides real-time monitoring, automated control, predictive analytics, and user management for greenhouse operations.

**Key Quality Standards:**

- 🌱 **IoT-First**: Real-time sensor data, hardware integration, edge computing
- 🔒 **Security**: Authentication, API security, device security, data encryption
- 🤖 **AI-Driven**: Machine learning predictions, pattern recognition, automation
- 📊 **Data-Rich**: Time-series data, analytics, reporting, insights
- 🏗️ **Microservices**: Monorepo with specialized services and clear boundaries

Follow these steps for each prompt called:

## 1. Memory Initialization

If this is the first interaction, initialize your memory with these core entities:

### Core System Entities

- **IoT_Greenhouse_System**: Main greenhouse monitoring and control platform
- **Greenhouse_CI_CD_System**: CI/CD infrastructure with multi-platform builds
- **User_Developer**: The developer working on this system
- **Conversation_Context**: Current session context
- **Knowledge_Graph**: Technical knowledge repository

### IoT Domain Entities

- **Greenhouse_Entity**: Physical greenhouse with location, configuration, and status
- **Plant_Entity**: Plants being monitored with species, growth stages, and requirements
- **Sensor_Entity**: Hardware sensors (temperature, humidity, soil moisture, flow, etc.)
- **User_Entity**: System users with roles (admin, operator, viewer) and greenhouse access
- **Blog_Entity**: Content management for greenhouse-related posts and documentation

### Technical Architecture Entities

- **Monorepo_Structure**: Turborepo with apps/web (Next.js), apps/api (NestJS), apps/esp (ESP32), apps/ai (Python)
- **Docker_Infrastructure**: Containerized services for development and production
- **Database_Layer**: Prisma ORM with PostgreSQL for relational data and time-series optimization
- **Authentication_System**: JWT authentication with role-based access control
- **Hardware_Layer**: ESP32 microcontrollers, sensors, actuators, and communication protocols
- **AI_ML_System**: Python-based machine learning for predictions and insights

### IoT Hardware Entities

- **ESP32_Sensors**: Temperature, humidity, soil moisture, light, pH, and flow sensors
- **ESP32_Actuators**: Water pumps, fans, heaters, LED grow lights, and servo motors
- **Communication_Protocols**: WiFi, MQTT, HTTP, and serial communication
- **Power_Management**: Battery backup, solar integration, and power optimization

### Data Management Entities

- **Sensor_Data_System**: Real-time data collection, storage, and time-series analysis
- **Alert_System**: Threshold-based alerts and notifications
- **Control_System**: Automated responses and manual control interfaces
- **Reporting_System**: Analytics, insights, and data visualization

### AI/ML Entities

- **Prediction_Models**: LSTM models for environmental forecasting
- **Pattern_Recognition**: Growth pattern analysis and anomaly detection
- **Optimization_Algorithms**: Resource usage optimization and scheduling
- **Data_Analysis**: Statistical analysis and trend identification

## 2. Memory Retrieval

- Always begin by saying "Remembering..." and retrieve relevant system context
- Reference your technical knowledge as "memory" about the IoT greenhouse architecture
- Prioritize recent system changes, sensor readings, and automation patterns

## 3. Technical Memory Categories

Monitor and store information about:

### a) System Architecture

- Turborepo monorepo structure with apps/web, apps/api, apps/esp, and apps/ai
- Next.js 15+ App Router with real-time dashboard and PWA capabilities
- NestJS modular architecture with IoT-specific modules (sensor, plant, greenhouse)
- ESP32 firmware with sensor libraries and communication protocols
- Python AI/ML services with TensorFlow/PyTorch and data processing pipelines
- Prisma ORM with PostgreSQL optimized for time-series data and relationships

### b) IoT Hardware & Communication

- **ESP32 Development**: PlatformIO configuration, sensor libraries, and firmware updates
- **Sensor Integration**: Calibration, data validation, and error handling
- **Communication Protocols**: MQTT broker setup, WiFi configuration, and data transmission
- **Hardware Reliability**: Watchdog timers, error recovery, and fault tolerance
- **Power Management**: Deep sleep modes, battery monitoring, and solar integration
- **Over-the-Air Updates**: Firmware deployment and version management

### c) Data Pipeline & Analytics

- **Real-time Data**: WebSocket connections, live dashboards, and streaming data
- **Time-series Storage**: Efficient database design for sensor data and historical analysis
- **Data Processing**: Preprocessing, cleaning, and validation pipelines
- **ML Predictions**: Model training, inference, and continuous learning
- **Visualization**: Charts, graphs, and interactive dashboards
- **Alerts & Notifications**: Threshold monitoring and automated responses

### d) User Interface & Experience

- **Dashboard Design**: Real-time monitoring, control panels, and responsive design
- **Mobile Optimization**: PWA features, offline capabilities, and touch interfaces
- **Data Visualization**: Interactive charts, graphs, and sensor readings
- **Control Interfaces**: Manual overrides, scheduling, and automation settings
- **User Management**: Role-based access, greenhouse permissions, and audit logs

### e) API Patterns & Integration

- **RESTful APIs**: Sensor data endpoints, control commands, and status queries
- **Real-time APIs**: WebSocket connections and Server-Sent Events
- **Authentication**: JWT with device authentication and API key management
- **Data Validation**: Sensor data verification and anomaly detection
- **External Integrations**: Weather APIs, notification services, and cloud storage

### f) AI/ML & Automation

- **Predictive Models**: Environmental forecasting and plant growth predictions
- **Automation Rules**: Condition-based actions and scheduling systems
- **Pattern Recognition**: Anomaly detection and trend analysis
- **Optimization**: Resource usage optimization and energy efficiency
- **Continuous Learning**: Model retraining and performance monitoring

### g) Business Logic & Domain

- **Greenhouse Operations**: Multi-greenhouse support, zone management, and crop rotation
- **Plant Management**: Species-specific care, growth tracking, and harvest planning
- **User Roles**: Admin, operator, and viewer permissions with greenhouse access
- **Maintenance Scheduling**: Equipment maintenance, calibration, and replacement tracking
- **Reporting & Analytics**: Performance metrics, yield analysis, and cost tracking

## 4. Memory Update Strategy

When new information is encountered:

### a) Technical Entities

- Create entities for new sensors, actuators, or hardware components
- Document new communication protocols and integration patterns
- Record new ML models, algorithms, and prediction accuracy
- Store automation rules and their performance metrics
- Track firmware updates and hardware configuration changes

### b) Data & Analytics Entities

- Document new data processing pipelines and analytics methods
- Record sensor calibration data and accuracy improvements
- Store successful automation patterns and their outcomes
- Track system performance metrics and optimization results
- Monitor prediction accuracy and model performance over time

### c) IoT Operations & Automation

- Document greenhouse operation patterns and automation rules
- Record successful control strategies and their effectiveness
- Store environmental optimization techniques and results
- Track equipment maintenance schedules and procedures
- Monitor energy usage patterns and efficiency improvements

### d) System Relationships

- Connect sensor data to plant health and growth patterns
- Map environmental conditions to automation responses
- Document hardware dependencies and communication protocols
- Record configuration relationships between services
- Track data flow between ESP32, API, web interface, and AI services

### e) Development Context

- Store recent hardware changes and firmware updates
- Record debugging sessions for sensor or connectivity issues
- Document calibration procedures and accuracy improvements
- Track AI model training sessions and performance metrics
- Monitor system performance and optimization opportunities

## 5. Contextual Observations

Always maintain observations about:

### System State

- Current sensor readings and environmental conditions
- Recent automation actions and their effectiveness
- Hardware status and connectivity health
- AI model predictions and accuracy trends
- User interaction patterns with the system

### Code Quality

- Consistent error handling across all services (ESP32, API, web, AI)
- Proper data validation for sensor readings and user inputs
- Authentication and authorization for device and user access
- Testing coverage for hardware interfaces and ML models
- Security compliance for IoT devices and data transmission

### Development Operations

- Build performance across multiple platforms (ESP32, Node.js, Python)
- Hardware deployment and OTA update success rates
- AI model training and inference performance
- Database query optimization for time-series data
- Monitoring and alerting for system health and anomalies

### Business Requirements

- Real-time monitoring and control capabilities
- Predictive analytics and automation intelligence
- Multi-user access with appropriate permissions
- Maintenance scheduling and equipment tracking
- Reporting and analytics for greenhouse operations

## 6. IoT System Workflow Patterns

Document and maintain knowledge about:

### Data Flow Architecture

- **Sensor Data Collection**: ESP32 → MQTT/HTTP → NestJS API → Database
- **Real-time Updates**: WebSocket connections for live dashboard updates
- **AI Analysis Pipeline**: Historical data → Python ML models → Predictions → Actions
- **Control Commands**: Web interface → API → ESP32 actuators → Physical changes

### Hardware Management

- **Device Registration**: ESP32 authentication and configuration management
- **Firmware Updates**: OTA deployment with version control and rollback
- **Sensor Calibration**: Automated and manual calibration procedures
- **Fault Tolerance**: Watchdog timers, error recovery, and graceful degradation

### Automation Patterns

- **Threshold-based Actions**: Temperature, humidity, soil moisture triggers
- **Scheduled Operations**: Watering schedules, lighting cycles, maintenance tasks
- **Predictive Controls**: ML-driven preemptive actions based on forecasts
- **Manual Overrides**: User-initiated actions and emergency controls

### Data Management

- **Time-series Storage**: Efficient storage and retrieval of sensor data
- **Data Aggregation**: Hourly, daily, and weekly summaries for analysis
- **Backup and Recovery**: Data protection and disaster recovery procedures
- **Privacy and Security**: Data encryption and access control

### User Experience

- **Dashboard Design**: Real-time widgets, charts, and control interfaces
- **Mobile Optimization**: Responsive design and PWA capabilities
- **Notification System**: Alerts, warnings, and status updates
- **Role-based Access**: Different interfaces for admins, operators, and viewers

### AI/ML Pipeline

- **Data Preprocessing**: Cleaning, normalization, and feature engineering
- **Model Training**: LSTM models for environmental prediction
- **Inference Engine**: Real-time predictions and pattern recognition
- **Continuous Learning**: Model updates based on new data and performance

## 7. Relationship Patterns

Maintain these key relationships in memory:

- **Greenhouse** `contains` **Plant** (greenhouse plant inventory)
- **Plant** `monitored_by` **Sensor** (plant-specific sensor assignments)
- **Sensor** `generates` **SensorData** (time-series data relationships)
- **User** `manages` **Greenhouse** (user access and permissions)
- **User** `creates` **Blog** (content management for greenhouse documentation)
- **SensorData** `triggers` **Automation** (condition-based actions)
- **AI_Model** `analyzes` **SensorData** (predictive analytics)
- **ESP32_Device** `hosts` **Sensor** (hardware sensor mapping)
- **Automation** `controls` **Actuator** (automated responses)
- **Alert** `notifies` **User** (threshold-based notifications)
- **Report** `summarizes` **GrowthData** (analytics and insights)
- **MaintenanceTask** `schedules` **Equipment** (maintenance tracking)

This memory framework ensures comprehensive understanding of the IoT greenhouse system's technical architecture, hardware integration, automation logic, and development patterns, enabling more effective assistance with sensor programming, data analysis, automation design, and system optimization.

## Additional Memory Context

### IoT Excellence Standards

- **Real-time Performance**: Sub-second response times for critical alerts and controls
- **Hardware Reliability**: 99.9% uptime with fault tolerance and automatic recovery
- **Data Integrity**: Validated sensor readings with anomaly detection and correction
- **Security First**: Device authentication, encrypted communication, and secure APIs
- **Scalability**: Support for multiple greenhouses and hundreds of sensors

### Development Best Practices

- **Hardware Abstraction**: Clean interfaces between firmware and higher-level services
- **Microservice Architecture**: Independent services for different system components
- **Test-Driven Development**: Comprehensive testing including hardware-in-the-loop testing
- **Continuous Integration**: Multi-platform builds and automated deployment pipelines
- **Documentation**: Comprehensive documentation for setup, configuration, and maintenance
- **Automated Rollback**: Health check failures trigger automatic rollback procedures

### Development Workflow Integration

- **Branch Protection**: Enforced quality standards prevent broken code in main branches
- **Code Review**: Mandatory peer review with automated quality assistance
- **Performance Monitoring**: Continuous tracking of build times, test execution, and deployment success
- **Documentation**: Automated generation of coverage reports, security scan results, and deployment status
