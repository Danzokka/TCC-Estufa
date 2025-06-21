---
applyTo: "docker/**/*,**/Dockerfile,**/docker-compose.yml,**/docker-compose.yaml"
---

# DevOps & Services Guidelines - Docker & Observabilidade

## Containerização

### Docker

- Use multi-stage builds para otimizar tamanho de imagens
- Implemente healthchecks em todos os containers
- Use .dockerignore para excluir arquivos desnecessários
- Configure non-root user para segurança
- Use specific tags, evite 'latest'

### Docker Compose

- Organize services por stack (app, database, monitoring)
- Use networks para isolar comunicação entre services
- Configure volumes para persistência de dados
- Implemente depends_on com condition: service_healthy

## Observabilidade Stack

### Grafana

- Configure dashboards para métricas da aplicação
- Implemente alerting para métricas críticas
- Use folders para organizar dashboards por domínio
- Configure provisioning para dashboards as code

### Prometheus

- Configure scraping de métricas da aplicação
- Implemente service discovery para containers
- Use labels para organizar targets
- Configure retention apropriado para dados

### Loki

- Configure log aggregation da aplicação
- Use structured logging (JSON) nos apps
- Implemente log levels apropriados
- Configure retention policy para logs

### Exemplos de Configuração

```dockerfile
# Dockerfile multi-stage para Next.js
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:18-alpine AS production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml estruturado
services:
  # Application Stack
  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    depends_on:
      api:
        condition: service_healthy
    networks:
      - app-network

  api:
    build: ./apps/api
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network
      - db-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Database Stack
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: portfolio
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - db-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d portfolio"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Monitoring Stack
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    networks:
      - monitoring

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki.yml:/etc/loki/local-config.yaml
    networks:
      - monitoring

networks:
  app-network:
  db-network:
  monitoring:

volumes:
  postgres_data:
  prometheus_data:
  grafana_data:
```
