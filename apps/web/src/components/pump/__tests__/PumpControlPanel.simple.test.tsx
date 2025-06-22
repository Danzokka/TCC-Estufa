/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PumpControlPanel } from "../PumpControlPanel";

// Simple mock for pump actions
const mockActivatePump = jest.fn();
const mockStopPump = jest.fn();

jest.mock("../../actions/pump", () => ({
  activatePump: mockActivatePump,
  stopPump: mockStopPump,
}));

// Mock toast
const mockToast = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    success: mockToast,
    error: mockToast,
    loading: mockToast,
  },
}));

describe("PumpControlPanel", () => {
  const defaultProps = {
    greenhouseId: "test-greenhouse-123",
    isActive: false,
    currentOperation: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockActivatePump.mockResolvedValue({ success: true });
    mockStopPump.mockResolvedValue({ success: true });
  });

  it("should render pump control panel", () => {
    render(<PumpControlPanel {...defaultProps} />);

    expect(screen.getByText("Water Pump Control")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start pump/i })
    ).toBeInTheDocument();
  });

  it("should show stop button when pump is active", () => {
    const activeProps = {
      ...defaultProps,
      isActive: true,
      currentOperation: {
        id: "op-123",
        durationType: "time" as const,
        duration: 30,
        startedAt: new Date().toISOString(),
        status: "active" as const,
      },
    };

    render(<PumpControlPanel {...activeProps} />);

    expect(
      screen.getByRole("button", { name: /stop pump/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /start pump/i })
    ).not.toBeInTheDocument();
  });

  it("should activate pump with time duration", async () => {
    const user = userEvent.setup();

    render(<PumpControlPanel {...defaultProps} />);

    const durationInput = screen.getByLabelText(/duration \(seconds\)/i);
    const startButton = screen.getByRole("button", { name: /start pump/i });

    await user.type(durationInput, "60");
    await user.click(startButton);

    // Should show confirmation dialog
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockActivatePump).toHaveBeenCalledWith({
        greenhouseId: "test-greenhouse-123",
        durationType: "time",
        duration: 60,
      });
    });
  });

  it("should activate pump with water quantity", async () => {
    const user = userEvent.setup();

    render(<PumpControlPanel {...defaultProps} />);

    // Switch to quantity mode
    const quantityRadio = screen.getByLabelText(/water quantity/i);
    await user.click(quantityRadio);

    const quantityInput = screen.getByLabelText(/quantity \(liters\)/i);
    const startButton = screen.getByRole("button", { name: /start pump/i });

    await user.type(quantityInput, "2.5");
    await user.click(startButton);

    // Confirm
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockActivatePump).toHaveBeenCalledWith({
        greenhouseId: "test-greenhouse-123",
        durationType: "quantity",
        waterQuantity: 2.5,
      });
    });
  });

  it("should stop pump when stop button is clicked", async () => {
    const user = userEvent.setup();

    const activeProps = {
      ...defaultProps,
      isActive: true,
      currentOperation: {
        id: "op-123",
        durationType: "time" as const,
        duration: 30,
        startedAt: new Date().toISOString(),
        status: "active" as const,
      },
    };

    render(<PumpControlPanel {...activeProps} />);

    const stopButton = screen.getByRole("button", { name: /stop pump/i });
    await user.click(stopButton);

    await waitFor(() => {
      expect(mockStopPump).toHaveBeenCalledWith("test-greenhouse-123");
    });
  });

  it("should handle activation errors", async () => {
    const user = userEvent.setup();

    mockActivatePump.mockResolvedValue({
      success: false,
      error: "Device not found",
    });

    render(<PumpControlPanel {...defaultProps} />);

    const durationInput = screen.getByLabelText(/duration \(seconds\)/i);
    const startButton = screen.getByRole("button", { name: /start pump/i });

    await user.type(durationInput, "60");
    await user.click(startButton);

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith("Device not found");
    });
  });

  it("should validate duration input", async () => {
    const user = userEvent.setup();

    render(<PumpControlPanel {...defaultProps} />);

    const startButton = screen.getByRole("button", { name: /start pump/i });
    await user.click(startButton);

    // Should not open dialog without valid input
    expect(
      screen.queryByRole("button", { name: /confirm/i })
    ).not.toBeInTheDocument();
  });
});
