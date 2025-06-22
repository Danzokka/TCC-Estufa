import { PumpStatus, PumpOperation } from "@/app/actions/pump";

export const mockPumpStatus: PumpStatus = {
  id: "pump-status-1",
  greenhouseId: "greenhouse-123",
  isActive: false,
  remainingTime: 0,
  targetWaterAmount: 500,
  currentWaterAmount: 0,
  startTime: new Date("2024-01-01T10:00:00Z"),
  endTime: new Date("2024-01-01T10:05:00Z"),
  notes: "Test pump operation",
  deviceStatus: "online",
  lastUpdate: new Date("2024-01-01T10:05:00Z"),
};

export const mockActivePumpStatus: PumpStatus = {
  ...mockPumpStatus,
  isActive: true,
  remainingTime: 180,
  currentWaterAmount: 250,
  endTime: new Date(Date.now() + 180000), // 3 minutes from now
};

export const mockPumpOperation: PumpOperation = {
  id: "operation-1",
  greenhouseId: "greenhouse-123",
  deviceId: "esp32-001",
  operationType: "time_based",
  targetDuration: 300,
  targetWaterAmount: 500,
  actualDuration: 300,
  actualWaterAmount: 485,
  status: "completed",
  startedAt: new Date("2024-01-01T10:00:00Z"),
  completedAt: new Date("2024-01-01T10:05:00Z"),
  notes: "Successful pump operation",
  errorMessage: undefined,
};

export const mockFailedPumpOperation: PumpOperation = {
  ...mockPumpOperation,
  id: "operation-2",
  status: "failed",
  errorMessage: "Device not responding",
  actualDuration: 0,
  actualWaterAmount: 0,
  completedAt: new Date("2024-01-01T10:00:30Z"),
};

export const mockPumpHistory: PumpOperation[] = [
  mockPumpOperation,
  mockFailedPumpOperation,
  {
    ...mockPumpOperation,
    id: "operation-3",
    status: "pending",
    startedAt: new Date("2024-01-01T11:00:00Z"),
    actualDuration: undefined,
    actualWaterAmount: undefined,
    completedAt: undefined,
  },
];
