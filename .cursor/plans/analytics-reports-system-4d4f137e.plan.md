<!-- 4d4f137e-0454-451f-aec5-ae153cfbccc5 acf704cf-4a39-4a72-8e50-65f38f8b2d80 -->
# Sistema de Análises e Relatórios

## 1. Atualização do Schema do Banco de Dados

### 1.1 Adicionar vinculação de plantas à estufa

**Arquivo**: `apps/api/prisma/schema.prisma`

Adicionar campo `greenhouseId` ao modelo `UserPlant`:

```prisma
model UserPlant {
  id              String      @id @default(uuid())
  userId          String
  plantId         String
  greenhouseId    String?     // Nova relação com estufa
  greenhouse      Greenhouse? @relation(fields: [greenhouseId], references: [id])
  user            User        @relation(fields: [userId], references: [id])
  plant           Plant       @relation(fields: [plantId], references: [id])
  nickname        String?
  dateAdded       DateTime    @default(now())
  sensorReadings  Sensor[]
  
  @@unique([userId, plantId])
}
```

### 1.2 Criar modelos para dados climáticos e relatórios

Adicionar novos modelos:

```prisma
model WeatherData {
  id               String    @id @default(uuid())
  greenhouseId     String
  greenhouse       Greenhouse @relation(fields: [greenhouseId], references: [id], onDelete: Cascade)
  date             DateTime  // Data da leitura climática
  
  // Dados meteorológicos
  maxTemp          Float     // Temperatura máxima (°C)
  minTemp          Float     // Temperatura mínima (°C)
  avgTemp          Float     // Temperatura média (°C)
  maxHumidity      Float     // Umidade máxima (%)
  minHumidity      Float     // Umidade mínima (%)
  avgHumidity      Float     // Umidade média (%)
  totalPrecip      Float     // Precipitação total (mm)
  avgWind          Float?    // Velocidade média do vento (km/h)
  maxWind          Float?    // Rajada máxima (km/h)
  condition        String?   // Condição climática (sunny, cloudy, rainy, etc.)
  sunrise          String?   // Hora do nascer do sol
  sunset           String?   // Hora do pôr do sol
  
  // Metadados
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  @@index([greenhouseId])
  @@index([date])
  @@unique([greenhouseId, date])
}

model Report {
  id               String    @id @default(uuid())
  userPlantId      String
  userPlant        UserPlant @relation(fields: [userPlantId], references: [id], onDelete: Cascade)
  type             String    // 'weekly', 'monthly', 'general'
  
  // Período do relatório
  startDate        DateTime
  endDate          DateTime
  
  // Dados calculados
  totalReadings    Int       // Total de medições no período
  totalIrrigations Int       // Total de irrigações no período
  avgGrowthRate    Float?    // Taxa média de crescimento
  
  // Insights gerados pela IA
  summary          String?   // Resumo geral
  aiInsights       Json?     // Insights detalhados em JSON
  recommendations  Json?     // Recomendações em JSON
  
  // Dados climáticos do período
  weatherSummary   Json?     // Resumo do clima no período
  
  // Metadados
  generatedAt      DateTime  @default(now())
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  @@index([userPlantId])
  @@index([type])
  @@index([startDate])
  @@index([endDate])
}
```

Atualizar modelo `Greenhouse` para incluir relação com `WeatherData`:

```prisma
model Greenhouse {
  // ... campos existentes ...
  weatherData      WeatherData[]
  userPlants       UserPlant[]
}
```

Atualizar modelo `UserPlant` para incluir relação com `Report`:

```prisma
model UserPlant {
  // ... campos existentes ...
  reports          Report[]
}
```

## 2. Backend NestJS - Módulo Weather

### 2.1 Criar Weather Service

**Arquivo**: `apps/api/src/weather/weather.service.ts`

- Integração com WeatherAPI
- Endpoints: `/history.json` (7 dias) e `/forecast.json` (3 dias)
- Armazenamento de dados no banco via Prisma
- Cache para evitar chamadas duplicadas

Funcionalidades:

- `fetchHistoricalWeather(location: string, date: string)` - Busca dados históricos
- `fetchForecast(location: string, days: number)` - Busca previsão
- `saveWeatherData(greenhouseId: string, data: WeatherData)` - Salva no banco
- `getWeatherDataForPeriod(greenhouseId: string, startDate: Date, endDate: Date)` - Consulta dados do período

### 2.2 Criar Weather Controller

**Arquivo**: `apps/api/src/weather/weather.controller.ts`

Endpoints:

- `GET /weather/historical/:greenhouseId?date=YYYY-MM-DD` - Dados históricos
- `GET /weather/forecast/:greenhouseId` - Previsão
- `GET /weather/period/:greenhouseId?start=DATE&end=DATE` - Dados de período
- `POST /weather/sync/:greenhouseId` - Sincronizar dados (preencher histórico)

### 2.3 Criar Weather Module

**Arquivo**: `apps/api/src/weather/weather.module.ts`

## 3. Backend NestJS - Módulo Analytics

### 3.1 Criar Analytics Service

**Arquivo**: `apps/api/src/analytics/analytics.service.ts`

Funcionalidades:

- `generateWeeklyReport(userPlantId: string)` - Gera relatório semanal
- `generateMonthlyReport(userPlantId: string)` - Gera relatório mensal
- `generateGeneralReport(userPlantId: string)` - Gera relatório geral
- `getReports(userPlantId: string, type?: string)` - Lista relatórios
- `getReportById(reportId: string)` - Busca relatório específico
- `calculateMetrics(userPlantId: string, startDate: Date, endDate: Date)` - Calcula métricas do período

Métricas calculadas:

- Total de leituras de sensores
- Total de irrigações
- Média/min/max de cada parâmetro ambiental
- Desvio dos valores ideais da planta
- Comparação com período anterior

### 3.2 Integração com serviço AI

**Arquivo**: `apps/api/src/analytics/ai-integration.service.ts`

- HTTP client para comunicar com `apps/ai`
- Enviar dados do período para análise
- Receber insights e recomendações gerados pela IA

### 3.3 Criar Analytics Controller

**Arquivo**: `apps/api/src/analytics/analytics.controller.ts`

Endpoints:

- `POST /analytics/generate/:userPlantId?type=weekly|monthly|general` - Gera relatório
- `GET /analytics/reports/:userPlantId?type=weekly` - Lista relatórios
- `GET /analytics/report/:reportId` - Busca relatório específico
- `GET /analytics/latest/:userPlantId?type=weekly` - Último relatório do tipo

### 3.4 Criar Analytics Module

**Arquivo**: `apps/api/src/analytics/analytics.module.ts`

## 4. Serviço AI Python - Análise de Relatórios

### 4.1 Criar módulo de geração de relatórios

**Arquivo**: `apps/ai/analysis/report_generator.py`

Funcionalidades:

- Análise estatística dos dados do período
- Detecção de padrões e anomalias
- Correlação entre condições climáticas e crescimento
- Geração de insights em linguagem natural
- Recomendações personalizadas

### 4.2 Criar endpoint na API AI

**Arquivo**: `apps/ai/api/api_service.py`

Adicionar endpoint:

- `POST /api/generate-insights` - Recebe dados e retorna insights

Estrutura da requisição:

```python
{
  "user_plant_id": "uuid",
  "period_type": "weekly|monthly|general",
  "start_date": "ISO date",
  "end_date": "ISO date",
  "sensor_data": [...],
  "weather_data": [...],
  "irrigation_data": [...],
  "plant_ideal_values": {...}
}
```

Estrutura da resposta:

```python
{
  "summary": "Texto resumo geral",
  "insights": {
    "temperature": "Análise de temperatura...",
    "humidity": "Análise de umidade...",
    "soil_moisture": "Análise de umidade do solo...",
    "light": "Análise de luminosidade...",
    "irrigation": "Análise de irrigação...",
    "weather_impact": "Impacto do clima..."
  },
  "recommendations": [
    {
      "category": "irrigation",
      "priority": "high|medium|low",
      "description": "Recomendação específica"
    }
  ],
  "anomalies": [...]
}
```

### 4.3 Bibliotecas para análise

- `pandas` e `numpy` para manipulação de dados
- `scipy.stats` para análise estatística
- `matplotlib` e `seaborn` para geração de gráficos (se necessário)
- `scikit-learn` para detecção de anomalias

## 5. Backend NestJS - Atualização do Módulo Plant

### 5.1 Atualizar Plant Service

**Arquivo**: `apps/api/src/plant/plant.service.ts`

Adicionar método:

- `linkPlantToUser(userId: string, plantId: string, greenhouseId: string, nickname?: string)` - Vincula planta existente ao usuário e estufa

### 5.2 Atualizar Plant Controller

**Arquivo**: `apps/api/src/plant/plant.controller.ts`

Adicionar endpoint:

- `POST /plant/link` - Vincula planta existente ao usuário

DTO:

```typescript
class LinkPlantDto {
  plantId: string;
  greenhouseId: string;
  nickname?: string;
}
```

## 6. Frontend Next.js - Página de Adicionar Planta

### 6.1 Criar componente de seleção de planta

**Arquivo**: `apps/web/src/components/plants/add-plant-dialog.tsx`

- Dialog para adicionar planta
- Combobox para buscar e selecionar planta existente (da tabela Plant)
- Select para escolher estufa do usuário
- Input opcional para nickname
- Submit que chama server action

### 6.2 Criar server action

**Arquivo**: `apps/web/src/server/actions/plant.ts`

Adicionar:

```typescript
async function linkPlantToUser(data: {
  plantId: string;
  greenhouseId: string;
  nickname?: string;
}) {
  // Chama API /plant/link
}

async function getAvailablePlants() {
  // Retorna lista de plantas da tabela Plant
}

async function getUserGreenhouses() {
  // Retorna estufas do usuário
}
```

### 6.3 Atualizar página de plantas

**Arquivo**: `apps/web/src/app/dashboard/plants/page.tsx`

Adicionar botão "Adicionar Planta" que abre o dialog

## 7. Frontend Next.js - Página de Analytics

### 7.1 Criar componente de seleção de planta e período

**Arquivo**: `apps/web/src/app/dashboard/analytics/page.tsx`

Layout:

- Dropdown para selecionar planta do usuário
- Tabs para alternar entre Semanal/Mensal/Geral
- Botão "Gerar Relatório" (se não houver relatório recente)
- Botão "Atualizar Relatório" para forçar geração

### 7.2 Criar componentes de visualização do relatório

**Arquivo**: `apps/web/src/components/analytics/report-viewer.tsx`

Seções do relatório:

1. **Resumo Geral** (Card com texto gerado pela IA)
2. **Métricas do Período** (Cards com estatísticas)
3. **Gráficos de Evolução** (biblioteca `recharts`)

   - Temperatura ao longo do tempo
   - Umidade do ar ao longo do tempo
   - Umidade do solo ao longo do tempo
   - Luminosidade ao longo do tempo
   - Comparação com valores ideais

4. **Análise Climática** (Cards por dia com dados do WeatherAPI)
5. **Histórico de Irrigação** (Timeline com eventos)
6. **Insights por Categoria** (Cards expandíveis)
7. **Recomendações** (Lista com badges de prioridade)

### 7.3 Criar server actions para analytics

**Arquivo**: `apps/web/src/server/actions/analytics.ts`

```typescript
async function generateReport(userPlantId: string, type: 'weekly' | 'monthly' | 'general') {
  // Chama API /analytics/generate
}

async function getLatestReport(userPlantId: string, type: string) {
  // Chama API /analytics/latest
}

async function getReportById(reportId: string) {
  // Chama API /analytics/report/:id
}

async function getReportsList(userPlantId: string, type?: string) {
  // Chama API /analytics/reports
}
```

### 7.4 Componentes de gráficos

**Arquivos**: `apps/web/src/components/analytics/charts/*`

Usando componentes shadcn/ui (que utilizam recharts internamente):

- Instalar componentes de gráficos do shadcn: `npx shadcn@latest add chart`
- `temperature-chart.tsx` - Gráfico de linha (LineChart) para temperatura
- `humidity-chart.tsx` - Gráfico de linha (LineChart) para umidade
- `soil-moisture-chart.tsx` - Gráfico de área (AreaChart) para umidade do solo
- `light-chart.tsx` - Gráfico de linha (LineChart) para luminosidade
- `comparison-chart.tsx` - Gráfico de barras (BarChart) comparativo (valores atuais vs ideais)
- `irrigation-timeline.tsx` - Timeline customizado com eventos de irrigação

Todos os gráficos usarão os componentes do shadcn/ui:

- `ChartContainer` - Container principal com configuração
- `ChartTooltip` - Tooltips customizados
- `ChartLegend` - Legendas consistentes
- `ChartConfig` - Configuração de cores e labels

### 7.5 Solicitar localização ao usuário

**Arquivo**: `apps/web/src/components/greenhouse/location-dialog.tsx`

- Dialog para pedir localização quando usuário criar/editar estufa
- Input de texto para endereço/cidade
- Validação da localização via WeatherAPI
- Salvar no campo `location` da Greenhouse

## 8. Tarefas de Configuração

### 8.1 Adicionar variável de ambiente

**Arquivo**: `apps/api/.env`

Adicionar:

```
WEATHER_API_KEY=sua_chave_aqui
WEATHER_API_BASE_URL=http://api.weatherapi.com/v1
AI_SERVICE_URL=http://localhost:8000
```

### 8.2 Instalar dependências

**Backend**:

- `@nestjs/axios` para chamadas HTTP
- `axios` para cliente HTTP

**Frontend**:

- `recharts` para gráficos
- `date-fns` para formatação de datas

### 8.3 Executar migration

Após atualizar o schema, executar:

```bash
cd apps/api
pnpm prisma migrate dev --name add_analytics_and_weather
pnpm prisma generate
```

## 9. Cron Job para Geração Automática

### 9.1 Criar módulo de scheduler

**Arquivo**: `apps/api/src/scheduler/scheduler.service.ts`

Usando `@nestjs/schedule`:

- Gerar relatórios semanais toda segunda-feira às 00:00
- Gerar relatórios mensais todo dia 1 às 00:00
- Sincronizar dados climáticos históricos diariamente

### 9.2 Configurar Schedule Module

**Arquivo**: `apps/api/src/app.module.ts`

Adicionar `ScheduleModule.forRoot()` aos imports

## Ordem de Implementação

1. Atualizar schema do banco (1.1, 1.2) e executar migration
2. Implementar Weather Service (2.1, 2.2, 2.3)
3. Implementar Analytics Service básico (3.1, 3.3, 3.4)
4. Implementar gerador de insights na IA (4.1, 4.2, 4.3)
5. Integrar Analytics com IA (3.2)
6. Implementar funcionalidade de adicionar planta (5.1, 5.2, 6.1, 6.2, 6.3)
7. Implementar frontend de analytics (7.1, 7.2, 7.3, 7.4)
8. Implementar componente de localização (7.5)
9. Configurar cron jobs (9.1, 9.2)
10. Testes e ajustes finais

### To-dos

- [ ] Atualizar schema Prisma com UserPlant.greenhouseId, WeatherData e Report models
- [ ] Executar migration e gerar Prisma client
- [ ] Criar módulo Weather (service, controller, module) com integração à WeatherAPI
- [ ] Implementar gerador de insights em Python (report_generator.py e endpoint na API AI)
- [ ] Criar Analytics Service com métodos de geração de relatórios e cálculo de métricas
- [ ] Criar AI Integration Service para comunicação entre NestJS e serviço Python
- [ ] Criar Analytics Controller com endpoints de geração e consulta de relatórios
- [ ] Atualizar Plant Service e Controller para adicionar método de vincular planta existente
- [ ] Criar dialog e server actions para adicionar planta no frontend
- [ ] Criar componente para solicitar localização da estufa
- [ ] Implementar página de analytics com seleção de planta e tabs de períodos
- [ ] Criar componentes de visualização de relatórios com todas as seções
- [ ] Implementar componentes de gráficos usando recharts
- [ ] Criar módulo de scheduler para geração automática de relatórios