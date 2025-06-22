import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PumpControlPanel } from "../PumpControlPanel";
import { mockPumpStatus, mockActivePumpStatus } from "@/__mocks__/pumpData";
import * as pumpActions from "@/server/actions/pump";

// Mock the pump actions
jest.mock("@/app/actions/pump");
const mockPumpActions = pumpActions as jest.Mocked<typeof pumpActions>;

// Mock Sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock Next.js revalidation
jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}));

describe("PumpControlPanel", () => {
  const defaultProps = {
    greenhouseId: "greenhouse-123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with default state", () => {
    render(<PumpControlPanel {...defaultProps} />);

    expect(screen.getByText("Water Pump Control")).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/water amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /activate pump/i })
    ).toBeInTheDocument();
  });

  it("should render with initial status", () => {
    render(
      <PumpControlPanel {...defaultProps} initialStatus={mockPumpStatus} />
    );

    expect(screen.getByText("Pump Status")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("should render active pump status", () => {
    render(
      <PumpControlPanel
        {...defaultProps}
        initialStatus={mockActivePumpStatus}
      />
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText(/3:00/)).toBeInTheDocument(); // 180 seconds formatted
    expect(
      screen.getByRole("button", { name: /stop pump/i })
    ).toBeInTheDocument();
  });

  it("should handle successful pump activation", async () => {
    const user = userEvent.setup();
    const mockOnStatusChange = jest.fn();

    mockPumpActions.activatePump.mockResolvedValue({
      success: true,
      operationId: "op-123",
      message: "Bomba ativada com sucesso",
      data: {
        id: "op-123",
        greenhouseId: "greenhouse-123",
        deviceId: "esp32-001",
        operationType: "time_based",
        targetDuration: 300,
        status: "pending",
        notes: "Manual activation",
      },
    });

    mockPumpActions.getPumpStatus.mockResolvedValue({
      success: true,
      data: mockActivePumpStatus,
      message: "Status retrieved",
    });

    render(
      <PumpControlPanel {...defaultProps} onStatusChange={mockOnStatusChange} />
    );

    // Set duration to 300 seconds
    const durationInput = screen.getByLabelText(/duration/i);
    await user.clear(durationInput);
    await user.type(durationInput, "300");

    // Set reason
    const reasonInput = screen.getByLabelText(/reason/i);
    await user.type(reasonInput, "Test activation");

    // Click activate button
    const activateButton = screen.getByRole("button", {
      name: /activate pump/i,
    });
    await user.click(activateButton);

    await waitFor(() => {
      expect(mockPumpActions.activatePump).toHaveBeenCalledWith({
        greenhouseId: "greenhouse-123",
        duration: 300,
        waterAmount: undefined,
        notes: "Test activation",
      });
    });
  });

  it("should handle pump activation with water amount", async () => {
    const user = userEvent.setup();

    mockPumpActions.activatePump.mockResolvedValue({
      success: true,
      operationId: "op-124",
      message: "Bomba ativada com sucesso",
    });

    mockPumpActions.getPumpStatus.mockResolvedValue({
      success: true,
      data: mockActivePumpStatus,
      message: "Status retrieved",
    });

    render(<PumpControlPanel {...defaultProps} />);

    // Set water amount
    const waterAmountInput = screen.getByLabelText(/water amount/i);
    await user.type(waterAmountInput, "1000");

    // Set duration
    const durationInput = screen.getByLabelText(/duration/i);
    await user.clear(durationInput);
    await user.type(durationInput, "180");

    const activateButton = screen.getByRole("button", {
      name: /activate pump/i,
    });
    await user.click(activateButton);

    await waitFor(() => {
      expect(mockPumpActions.activatePump).toHaveBeenCalledWith({
        greenhouseId: "greenhouse-123",
        duration: 180,
        waterAmount: 1000,
        notes: "Manual activation",
      });
    });
  });

  it("should handle pump activation error", async () => {
    const user = userEvent.setup();

    mockPumpActions.activatePump.mockResolvedValue({
      success: false,
      message: "Device not responding",
    });

    render(<PumpControlPanel {...defaultProps} />);

    const activateButton = screen.getByRole("button", {
      name: /activate pump/i,
    });
    await user.click(activateButton);

    await waitFor(() => {
      expect(screen.getByText("Device not responding")).toBeInTheDocument();
    });
  });

  it("should handle pump stop", async () => {
    const user = userEvent.setup();
    const mockOnStatusChange = jest.fn();

    mockPumpActions.stopPump.mockResolvedValue({
      success: true,
      message: "Bomba parada com sucesso",
    });

    mockPumpActions.getPumpStatus.mockResolvedValue({
      success: true,
      data: mockPumpStatus, // Inactive status after stop
      message: "Status retrieved",
    });

    render(
      <PumpControlPanel
        {...defaultProps}
        initialStatus={mockActivePumpStatus}
        onStatusChange={mockOnStatusChange}
      />
    );

    const stopButton = screen.getByRole("button", { name: /stop pump/i });
    await user.click(stopButton);

    await waitFor(() => {
      expect(mockPumpActions.stopPump).toHaveBeenCalledWith("greenhouse-123");
    });
  });

  it("should handle pump stop error", async () => {
    const user = userEvent.setup();

    mockPumpActions.stopPump.mockResolvedValue({
      success: false,
      message: "No active operation found",
    });

    render(
      <PumpControlPanel
        {...defaultProps}
        initialStatus={mockActivePumpStatus}
      />
    );

    const stopButton = screen.getByRole("button", { name: /stop pump/i });
    await user.click(stopButton);

    await waitFor(() => {
      expect(screen.getByText("No active operation found")).toBeInTheDocument();
    });
  });

  it("should disable activate button when pump is active", () => {
    render(
      <PumpControlPanel
        {...defaultProps}
        initialStatus={mockActivePumpStatus}
      />
    );

    const activateButton = screen.getByRole("button", {
      name: /activate pump/i,
    });
    expect(activateButton).toBeDisabled();
  });

  it("should disable stop button when pump is inactive", () => {
    render(
      <PumpControlPanel {...defaultProps} initialStatus={mockPumpStatus} />
    );

    const stopButton = screen.getByRole("button", { name: /stop pump/i });
    expect(stopButton).toBeDisabled();
  });

  it("should validate greenhouse ID requirement", async () => {
    const user = userEvent.setup();

    render(<PumpControlPanel greenhouseId="" />);

    const activateButton = screen.getByRole("button", {
      name: /activate pump/i,
    });
    await user.click(activateButton);

    await waitFor(() => {
      expect(screen.getByText("Greenhouse ID is required")).toBeInTheDocument();
    });

    expect(mockPumpActions.activatePump).not.toHaveBeenCalled();
  });

  it("should show loading state during activation", async () => {
    const user = userEvent.setup();

    // Mock a delayed response
    mockPumpActions.activatePump.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                operationId: "op-123",
                message: "Success",
              }),
            100
          )
        )
    );

    mockPumpActions.getPumpStatus.mockResolvedValue({
      success: true,
      data: mockActivePumpStatus,
      message: "Status retrieved",
    });

    render(<PumpControlPanel {...defaultProps} />);

    const activateButton = screen.getByRole("button", {
      name: /activate pump/i,
    });
    await user.click(activateButton);

    // Should show loading state
    expect(activateButton).toBeDisabled();
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(activateButton).not.toBeDisabled();
    });
  });

  it("should format remaining time correctly", () => {
    const statusWith125Seconds = {
      ...mockActivePumpStatus,
      remainingTime: 125, // 2:05
    };

    render(
      <PumpControlPanel
        {...defaultProps}
        initialStatus={statusWith125Seconds}
      />
    );

    expect(screen.getByText("2:05")).toBeInTheDocument();
  });

  it("should display device status", () => {
    const offlineStatus = {
      ...mockPumpStatus,
      deviceStatus: "offline" as const,
    };

    render(
      <PumpControlPanel {...defaultProps} initialStatus={offlineStatus} />
    );

    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("should call onStatusChange when status updates", async () => {
    const user = userEvent.setup();
    const mockOnStatusChange = jest.fn();

    mockPumpActions.activatePump.mockResolvedValue({
      success: true,
      operationId: "op-123",
      message: "Success",
    });

    mockPumpActions.getPumpStatus.mockResolvedValue({
      success: true,
      data: mockActivePumpStatus,
      message: "Status retrieved",
    });

    render(
      <PumpControlPanel {...defaultProps} onStatusChange={mockOnStatusChange} />
    );

    const activateButton = screen.getByRole("button", {
      name: /activate pump/i,
    });
    await user.click(activateButton);

    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalledWith(mockActivePumpStatus);
    });
  });
});
