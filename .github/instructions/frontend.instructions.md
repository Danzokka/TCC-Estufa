---
applyTo: "apps/web/**/*.{ts,tsx,js,jsx}"
---

# Frontend Development Guidelines - IoT Greenhouse System

## Links

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/blog/tailwindcss-v4)
- [Shadcn UI Documentation](https://ui.shadcn.com/docs)
- [Magic UI Documentation](https://magicui.design/docs)
- [React Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)

## Tech Stack

- Next.js 15+ with App Router (NEVER use pages router)
- React 19+ with Server Components
- TypeScript with interfaces (not types)
- Tailwind CSS + Shadcn UI + Magic UI for styling
- React Query (TanStack Query) for data fetching on client side
- Iron session for authentication and role-based access
- Recharts for data visualization
- PWA capabilities for mobile greenhouse monitoring

## Project Architecture

This is an IoT Greenhouse Monitoring and Control System with:

- **Real-time Dashboard**: Live sensor readings, charts, and controls
- **Greenhouse Management**: Multi-greenhouse support with zone controls
- **Plant Monitoring**: Species-specific tracking and care schedules
- **Automation Control**: Threshold-based and scheduled automations
- **User Management**: Role-based access (admin, operator, viewer)
- **Analytics & Reporting**: Historical data analysis and insights
- **Mobile-First Design**: Responsive PWA for on-the-go monitoring

## Directory Structure & Patterns

### Core Structure

```
apps/web/src/
├── app/                     # Next.js App Router pages
│   ├── (dashboard)/         # Main dashboard layout group
│   │   ├── dashboard/       # Real-time dashboard
│   │   ├── greenhouses/     # Greenhouse management
│   │   ├── plants/          # Plant monitoring
│   │   ├── automation/      # Automation controls
│   │   └── analytics/       # Data analysis & reports
│   ├── (auth)/             # Authentication layout group
│   └── globals.css         # Global styles
├── components/             # Shared components
│   ├── ui/                 # Shadcn UI components
│   ├── charts/             # Chart components
│   ├── dashboard/          # Dashboard widgets
│   ├── forms/              # Form components
│   └── layout/             # Layout components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── types/                  # TypeScript type definitions
└── context/                # React context providers
```

### Naming Conventions

- Use lowercase with hyphens for directories: `sensor-data`, `greenhouse-controls`
- Components use lowercase with hyphens: `sensor-widget.tsx`, `temperature-chart.tsx`
- Page-specific components go in `_components`: `src/app/dashboard/_components/`
- Page-specific utilities go in `_lib`: `src/app/analytics/_lib/`

### Component Organization

- **Server Actions**: Use `src/server/actions` for all data operations
- **Authentication**: Protected routes use layout-level authentication
- **PWA**: Service worker and manifest configuration

#### Server Actions for Data

```typescript
// Server actions for greenhouse data
"use server";

export async function getGreenhouseData(id: string) {
  // Fetch from NestJS API with proper error handling
}

export async function getSensorReadings(sensorId: string, timeRange: string) {
  // Time-series data with pagination
}

export async function triggerAutomation(automationId: string) {
  // Control actions with confirmation
}
```

#### Real-time Updates

- Implement React Query for server state management
- Use optimistic updates for control actions
- Handle connection drops gracefully


#### Responsive Design

- **Dashboard Layout**: Grid system that adapts to screen size
- **Touch-Friendly Controls**: Large buttons for actuator controls
- **Swipe Gestures**: Navigate between greenhouse zones
- **Offline Capabilities**: Show cached data when connection is lost

#### PWA Features

- **Push Notifications**: Critical alerts and threshold violations
- **Home Screen Installation**: Quick access to greenhouse monitoring
- **Offline Support**: Cache essential data and controls
- **Background Sync**: Update data when connection is restored

### Performance Optimizations

#### Data Visualization

- **Chart Performance**: Use canvas-based charts for large datasets
- **Data Aggregation**: Show hourly/daily summaries for historical data
- **Lazy Loading**: Load chart data on demand
- **Memory Management**: Clean up WebSocket connections properly

#### Real-time Updates

- **Throttling**: Limit update frequency to prevent UI flooding
- **Selective Updates**: Only update changed sensor values
- **Background Processing**: Use Web Workers for data processing
- **Connection Management**: Implement reconnection logic

### Security & Authentication

#### IoT-Specific Security

- **Device Authentication**: Secure API keys for ESP32 devices
- **Role-Based Access**: Different permissions for greenhouse operations
- **Audit Logging**: Track all control actions and configuration changes
- **Rate Limiting**: Prevent abuse of control endpoints

#### User Experience

- **Multi-Factor Authentication**: Enhanced security for admin users
- **Session Management**: Handle long-running monitoring sessions
- **Emergency Access**: Quick access for critical situations
- **Guest Mode**: Read-only access for visitors

### Error Handling & Reliability

#### IoT-Specific Error Handling

- **Sensor Failures**: Display last known values with timestamps
- **Connectivity Issues**: Show offline indicators and cached data
- **Control Failures**: Retry mechanisms with user feedback
- **Data Validation**: Validate sensor readings for anomalies

#### User Feedback

- **Loading States**: Show real-time data loading indicators
- **Error Boundaries**: Graceful failure handling for components
- **Success Feedback**: Confirm successful control actions
- **Status Messages**: Clear communication about system state

## Code Examples

### Sensor Widget Component

```typescript
interface SensorWidgetProps {
  sensor: {
    id: string;
    name: string;
    type: SensorType;
    value: number;
    unit: string;
    status: 'online' | 'offline' | 'error';
    lastUpdate: Date;
  };
  thresholds?: {
    min: number;
    max: number;
    optimal: { min: number; max: number };
  };
}

export function SensorWidget({ sensor, thresholds }: SensorWidgetProps) {
  const { data: liveData } = useSensorData(sensor.id);
  const isOutOfRange = thresholds && (
    liveData.value < thresholds.min ||
    liveData.value > thresholds.max
  );

  return (
    <Card className={cn("p-4", isOutOfRange && "border-red-500 bg-red-50")}>
      {/* Widget implementation */}
    </Card>
  );
}
```

### Control Panel Component

```typescript
interface ControlPanelProps {
  actuator: {
    id: string;
    name: string;
    type: 'pump' | 'fan' | 'heater' | 'light';
    status: 'on' | 'off' | 'auto';
    isOnline: boolean;
  };
}

export function ControlPanel({ actuator }: ControlPanelProps) {
  const [isPending, startTransition] = useTransition();

  const handleControl = (action: 'on' | 'off' | 'auto') => {
    startTransition(async () => {
      await controlActuator(actuator.id, action);
    });
  };

  return (
    <Card className="p-4">
      {/* Control implementation with confirmation */}
    </Card>
  );
}
```

This frontend architecture ensures a robust, real-time, and user-friendly interface for greenhouse monitoring and control, with proper error handling, security, and mobile optimization.
