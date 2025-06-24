---
applyTo: ".github/workflows/**/*.yml"
---

# CI/CD Guidelines - IoT Greenhouse System

## Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [PlatformIO CI Documentation](https://docs.platformio.org/en/latest/ci/index.html)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Python Testing with pytest](https://docs.pytest.org/en/stable/)

## Multi-Platform CI/CD Strategy

This IoT Greenhouse System requires a comprehensive CI/CD pipeline that handles:

- **Frontend (Next.js)**: Build, test, and deploy web application
- **Backend (NestJS)**: API testing, integration tests, and containerized deployment
- **Hardware (ESP32)**: Firmware compilation, testing, and OTA deployment
- **AI/ML (Python)**: Model training, testing, and deployment
- **Integration**: End-to-end testing across all platforms

## Pipeline Architecture

### Main CI Pipeline (`greenhouse-ci.yml`)

```yaml
name: IoT Greenhouse CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM for dependency checks

env:
  NODE_VERSION: "20"
  PYTHON_VERSION: "3.11"
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Detect changes to optimize build process
  changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.changes.outputs.frontend }}
      backend: ${{ steps.changes.outputs.backend }}
      esp32: ${{ steps.changes.outputs.esp32 }}
      ai: ${{ steps.changes.outputs.ai }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            frontend:
              - 'apps/web/**'
              - 'packages/**'
            backend:
              - 'apps/api/**'
              - 'prisma/**'
            esp32:
              - 'apps/esp/**'
              - 'platformio.ini'
            ai:
              - 'apps/ai/**'
              - 'requirements.txt'

  # Frontend testing and building
  frontend:
    needs: changes
    if: needs.changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit
        env:
          CI: true

      - name: Run component tests
        run: npm run test:components

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: frontend-test-results
          path: |
            apps/web/coverage/
            apps/web/test-results/

  # Backend API testing
  backend:
    needs: changes
    if: needs.changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: greenhouse_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Setup database
        run: |
          cd apps/api
          npx prisma migrate deploy
          npx prisma db seed
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/greenhouse_test

      - name: Run linting
        run: npm run lint:api

      - name: Run unit tests
        run: npm run test:api:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/greenhouse_test
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:api:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/greenhouse_test
          REDIS_URL: redis://localhost:6379

      - name: Run WebSocket tests
        run: npm run test:api:websocket

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/lcov.info
          flags: backend

  # ESP32 firmware compilation and testing
  esp32:
    needs: changes
    if: needs.changes.outputs.esp32 == 'true'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [development, production]
        board: [esp32dev, esp32-s3-devkitc-1]

    steps:
      - uses: actions/checkout@v4

      - name: Cache PlatformIO
        uses: actions/cache@v3
        with:
          path: |
            ~/.platformio/.cache
            ~/.platformio/lib
            ~/.platformio/platforms
          key: ${{ runner.os }}-pio-${{ hashFiles('**/platformio.ini') }}

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install PlatformIO
        run: |
          python -m pip install --upgrade pip
          pip install platformio

      - name: Run PlatformIO checks
        run: |
          cd apps/esp
          pio check --environment ${{ matrix.environment }}

      - name: Build firmware
        run: |
          cd apps/esp
          pio run --environment ${{ matrix.environment }}

      - name: Run unit tests
        run: |
          cd apps/esp
          pio test --environment native

      - name: Upload firmware artifacts
        uses: actions/upload-artifact@v3
        with:
          name: firmware-${{ matrix.environment }}-${{ matrix.board }}
          path: apps/esp/.pio/build/${{ matrix.environment }}/firmware.bin

  # AI/ML model training and testing
  ai-ml:
    needs: changes
    if: needs.changes.outputs.ai == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: "pip"

      - name: Install dependencies
        run: |
          cd apps/ai
          pip install -r requirements.txt
          pip install pytest pytest-cov

      - name: Run linting
        run: |
          cd apps/ai
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

      - name: Run type checking
        run: |
          cd apps/ai
          mypy . --ignore-missing-imports

      - name: Run unit tests
        run: |
          cd apps/ai
          pytest tests/ --cov=. --cov-report=xml

      - name: Test model performance
        run: |
          cd apps/ai
          python -m pytest tests/test_model_performance.py -v

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/ai/coverage.xml
          flags: ai-ml

  # Integration testing across platforms
  integration:
    needs: [frontend, backend, esp32, ai-ml]
    if: always() && (needs.frontend.result == 'success' || needs.backend.result == 'success')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup test environment
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 30 # Wait for services to be ready

      - name: Run integration tests
        run: |
          npm run test:integration

      - name: Test device communication
        run: |
          npm run test:device-integration

      - name: Test real-time features
        run: |
          npm run test:websocket-integration

      - name: Cleanup
        if: always()
        run: |
          docker-compose -f docker-compose.test.yml down

  # Security scanning
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: "fs"
          scan-ref: "."
          format: "sarif"
          output: "trivy-results.sarif"

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: "trivy-results.sarif"

      - name: Run dependency audit
        run: |
          npm audit --audit-level moderate
          cd apps/ai && pip-audit

  # Build and push Docker images
  docker:
    needs: [frontend, backend]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/api/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/api:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push Web image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/web/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/web:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/web:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push AI service image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/ai/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/ai:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/ai:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Pull Request Quality Gate (`pr-quality-gate.yml`)

```yaml
name: PR Quality Gate

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Analyze PR size
        run: |
          CHANGED_FILES=$(git diff --name-only origin/${{ github.base_ref }}...HEAD | wc -l)
          ADDED_LINES=$(git diff --numstat origin/${{ github.base_ref }}...HEAD | awk '{sum+=$1} END {print sum}')
          DELETED_LINES=$(git diff --numstat origin/${{ github.base_ref }}...HEAD | awk '{sum+=$2} END {print sum}')

          echo "Files changed: $CHANGED_FILES"
          echo "Lines added: $ADDED_LINES"
          echo "Lines deleted: $DELETED_LINES"

          if [ $CHANGED_FILES -gt 50 ]; then
            echo "⚠️ Large PR: Consider breaking into smaller PRs"
          fi

          if [ $ADDED_LINES -gt 1000 ]; then
            echo "⚠️ Large addition: Review complexity carefully"
          fi

      - name: Check for IoT security patterns
        run: |
          # Check for hardcoded credentials
          if grep -r "password\|secret\|key" --include="*.ts" --include="*.js" --include="*.cpp" --include="*.py" .; then
            echo "⚠️ Potential hardcoded credentials found"
            exit 1
          fi

          # Check for proper input validation in sensor endpoints
          if git diff --name-only origin/${{ github.base_ref }}...HEAD | grep -E "(sensor|device)" | grep -E "\.(ts|js)$"; then
            echo "✅ Sensor-related files changed - ensure proper validation"
          fi

      - name: Check ESP32 code quality
        if: contains(github.event.pull_request.changed_files, 'apps/esp/')
        run: |
          cd apps/esp
          # Check for proper error handling
          if ! grep -r "try\|catch\|error" src/; then
            echo "⚠️ ESP32 code should include error handling"
          fi

          # Check for power management
          if ! grep -r "sleep\|power" src/; then
            echo "💡 Consider power management optimizations"
          fi
```

### Deployment Pipeline (`deploy.yml`)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags: ["v*"]
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment to deploy to"
        required: true
        default: "staging"
        type: choice
        options:
          - staging
          - production

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/main' || github.event.inputs.environment == 'staging'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          # Deploy Docker containers to staging
          docker-compose -f docker-compose.staging.yml up -d

      - name: Run smoke tests
        run: |
          # Test critical endpoints
          curl -f http://staging.greenhouse.example.com/health

      - name: Test device connectivity
        run: |
          # Test ESP32 device can connect to staging
          npm run test:device-connectivity:staging

  deploy-production:
    if: startsWith(github.ref, 'refs/tags/v') || github.event.inputs.environment == 'production'
    runs-on: ubuntu-latest
    environment: production
    needs: [deploy-staging]
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          # Blue-green deployment
          docker-compose -f docker-compose.prod.yml up -d --scale web=2

      - name: Health checks
        run: |
          # Comprehensive health checks
          npm run health-check:production

      - name: Update firmware OTA
        run: |
          # Trigger OTA update for all connected devices
          npm run ota-update:production
```

## Quality Gates and Standards

### Test Coverage Requirements

```yaml
# In jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './apps/api/src/sensor/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './apps/web/src/components/dashboard/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

### Performance Budgets

```yaml
# In .github/workflows/performance.yml
- name: Performance audit
  run: |
    # Bundle size limits
    npm run build
    BUNDLE_SIZE=$(stat -c%s "apps/web/.next/static/js/*.js" | awk '{sum+=$1} END {print sum}')
    if [ $BUNDLE_SIZE -gt 1000000 ]; then # 1MB limit
      echo "Bundle size too large: $BUNDLE_SIZE bytes"
      exit 1
    fi

    # API response time limits
    npm run test:performance:api
```

### Security Gates

```yaml
# Security scanning configuration
- name: SAST scan
  uses: github/codeql-action/analyze@v2
  with:
    languages: javascript,typescript,python,cpp

- name: Container security scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
    format: "table"
    exit-code: "1"
    ignore-unfixed: true
    severity: "CRITICAL,HIGH"
```

## Environment Management

### Environment Variables

```yaml
# Development environment
DATABASE_URL: postgresql://localhost:5432/greenhouse_dev
REDIS_URL: redis://localhost:6379
MQTT_BROKER_URL: mqtt://localhost:1883
OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
JWT_SECRET: ${{ secrets.JWT_SECRET }}
DEVICE_API_KEY: ${{ secrets.DEVICE_API_KEY }}

# Production environment
DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
REDIS_URL: ${{ secrets.PROD_REDIS_URL }}
MQTT_BROKER_URL: ${{ secrets.PROD_MQTT_BROKER_URL }}
```

### Secrets Management

Required secrets in GitHub repository:

- `PROD_DATABASE_URL`: Production database connection string
- `PROD_REDIS_URL`: Production Redis connection string
- `JWT_SECRET`: JWT signing secret
- `DEVICE_API_KEY`: ESP32 device authentication key
- `OPENAI_API_KEY`: AI service API key
- `DOCKER_REGISTRY_TOKEN`: Container registry access token

## Monitoring and Observability

### Health Checks

```typescript
// Health check endpoint
@Get('health')
async health(): Promise<HealthStatus> {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      mqtt: await this.checkMqtt(),
      devices: await this.checkDeviceConnectivity()
    }
  };
}
```

### Metrics Collection

```yaml
# Prometheus metrics
- name: Collect metrics
  run: |
    # API response times
    # Active device count
    # Sensor data throughput
    # Error rates
    # Memory usage
```

## Best Practices

### Branch Protection Rules

```yaml
# Required status checks
- IoT Greenhouse CI/CD Pipeline / frontend
- IoT Greenhouse CI/CD Pipeline / backend
- IoT Greenhouse CI/CD Pipeline / esp32
- IoT Greenhouse CI/CD Pipeline / ai-ml
- IoT Greenhouse CI/CD Pipeline / integration
- IoT Greenhouse CI/CD Pipeline / security

# Restrictions
- Require branches to be up to date before merging
- Require linear history
- Dismiss stale PR reviews when new commits are pushed
- Require review from code owners
```

### Deployment Strategies

1. **Blue-Green Deployment**: Zero-downtime deployments with quick rollback
2. **Rolling Updates**: Gradual rollout for firmware updates
3. **Feature Flags**: Control feature rollout independently of deployment
4. **Health Checks**: Automated monitoring and alerting
5. **Rollback Procedures**: Automated rollback on health check failures

This comprehensive CI/CD pipeline ensures reliable, secure, and efficient deployment of the IoT Greenhouse System across all platforms while maintaining high quality and performance standards.
