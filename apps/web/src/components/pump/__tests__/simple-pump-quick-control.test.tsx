/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SimplePumpQuickControl } from "../simple-pump-quick-control";
import * as pumpSimpleActions from "../../../server/actions/pump-simple";

// Mock the device config hook
const mockUseDeviceConfig = jest.fn();

jest.mock("../../../hooks/useDeviceConfig", () => ({
  useDeviceConfig: mockUseDeviceConfig,
}));

// Mock pump actions
jest.mock("../../../server/actions/pump-simple", () => ({
  activateSimplePump: jest.fn(),
  stopSimplePump: jest.fn(),
  getSimpleDeviceStatus: jest.fn(),
}));

// Mock toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

// Mock Next.js Link
jest.mock("next/link", () => {
  return function MockedLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

// Type the mocked functions
const mockActivateSimplePump =
  pumpSimpleActions.activateSimplePump as jest.MockedFunction<
    typeof pumpSimpleActions.activateSimplePump
  >;
const mockStopSimplePump =
  pumpSimpleActions.stopSimplePump as jest.MockedFunction<
    typeof pumpSimpleActions.stopSimplePump
  >;
const mockGetSimpleDeviceStatus =
  pumpSimpleActions.getSimpleDeviceStatus as jest.MockedFunction<
    typeof pumpSimpleActions.getSimpleDeviceStatus
  >;

describe("SimplePumpQuickControl", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default device status - offline
    mockGetSimpleDeviceStatus.mockResolvedValue({
      success: false,
      message: "Device offline",
    });

    // Default device config
    mockUseDeviceConfig.mockReturnValue({
      deviceConfig: {
        deviceName: "Test ESP32",
        deviceIp: "192.168.1.100",
        description: "Test device",
        lastUpdated: new Date().toISOString(),
      },
      isLoading: false,
    });
  });

  it("should render device configuration prompt when no device is configured", () => {
    // Override the hook to return no config
    mockUseDeviceConfig.mockReturnValue({
      deviceConfig: null,
      isLoading: false,
    });

    render(<SimplePumpQuickControl />);

    expect(screen.getByText("Controle de Irrigação")).toBeInTheDocument();
    expect(
      screen.getByText(/Configure o IP do seu dispositivo ESP32/)
    ).toBeInTheDocument();
    expect(screen.getByText("Configurar Dispositivo")).toBeInTheDocument();
  });

  it("should render pump controls when device is configured", async () => {
    // Mock successful device status
    mockGetSimpleDeviceStatus.mockResolvedValue({
      success: true,
      data: {
        deviceIp: "192.168.1.100",
        deviceName: "Test ESP32",
        isActive: false,
        lastUpdate: new Date(),
      },
    });

    render(<SimplePumpQuickControl />);

    await waitFor(() => {
      expect(screen.getByText("Controle de Irrigação")).toBeInTheDocument();
      expect(screen.getByText("192.168.1.100")).toBeInTheDocument();
      expect(screen.getByText("30s")).toBeInTheDocument();
      expect(screen.getByText("1 min")).toBeInTheDocument();
      expect(screen.getByText("3 min")).toBeInTheDocument();
    });
  });

  it("should show device online status when connected", async () => {
    mockGetSimpleDeviceStatus.mockResolvedValue({
      success: true,
      data: {
        deviceIp: "192.168.1.100",
        deviceName: "Test ESP32",
        isActive: false,
        lastUpdate: new Date(),
      },
    });

    render(<SimplePumpQuickControl />);

    await waitFor(() => {
      expect(screen.getByText("Online")).toBeInTheDocument();
    });
  });

  it("should show device offline status when disconnected", async () => {
    mockGetSimpleDeviceStatus.mockResolvedValue({
      success: false,
      message: "Device offline",
    });

    render(<SimplePumpQuickControl />);

    await waitFor(() => {
      expect(screen.getByText("Offline")).toBeInTheDocument();
    });
  });

  it("should activate pump with correct duration when button is clicked", async () => {
    const user = userEvent.setup();

    mockGetSimpleDeviceStatus.mockResolvedValue({
      success: true,
      data: {
        deviceIp: "192.168.1.100",
        deviceName: "Test ESP32",
        isActive: false,
        lastUpdate: new Date(),
      },
    });

    mockActivateSimplePump.mockResolvedValue({
      success: true,
      message: "Pump activated successfully",
    });

    render(<SimplePumpQuickControl />);

    await waitFor(() => {
      expect(screen.getByText("30s")).toBeInTheDocument();
    });

    const button30s = screen.getByText("30s");
    await user.click(button30s);

    await waitFor(() => {
      expect(mockActivateSimplePump).toHaveBeenCalledWith({
        deviceIp: "192.168.1.100",
        duration: 30,
      });
    });
  });

  it("should show stop button when pump is active", async () => {
    mockGetSimpleDeviceStatus.mockResolvedValue({
      success: true,
      data: {
        deviceIp: "192.168.1.100",
        deviceName: "Test ESP32",
        isActive: true,
        remainingTime: 25,
        lastUpdate: new Date(),
      },
    });

    render(<SimplePumpQuickControl />);

    await waitFor(() => {
      expect(screen.getByText("Parar Irrigação")).toBeInTheDocument();
      expect(screen.getByText("Ativa")).toBeInTheDocument();
      expect(screen.getByText("0:25")).toBeInTheDocument(); // Remaining time
    });
  });

  it("should disable controls when device is offline", async () => {
    mockGetSimpleDeviceStatus.mockResolvedValue({
      success: false,
      message: "Device offline",
    });

    render(<SimplePumpQuickControl />);

    await waitFor(() => {
      const button30s = screen.getByText("30s");
      expect(button30s).toBeDisabled();
    });
  });

  it("should show error alert when device operation fails", async () => {
    const user = userEvent.setup();

    mockGetSimpleDeviceStatus.mockResolvedValue({
      success: true,
      data: {
        deviceIp: "192.168.1.100",
        deviceName: "Test ESP32",
        isActive: false,
        lastUpdate: new Date(),
      },
    });

    mockActivateSimplePump.mockResolvedValue({
      success: false,
      message: "Connection failed",
    });

    render(<SimplePumpQuickControl />);

    await waitFor(() => {
      expect(screen.getByText("30s")).toBeInTheDocument();
    });

    const button30s = screen.getByText("30s");
    await user.click(button30s);

    await waitFor(() => {
      expect(screen.getByText("Connection failed")).toBeInTheDocument();
    });
  });

  it("should handle stop pump action", async () => {
    const user = userEvent.setup();

    // Start with active pump
    mockGetSimpleDeviceStatus.mockResolvedValue({
      success: true,
      data: {
        deviceIp: "192.168.1.100",
        deviceName: "Test ESP32",
        isActive: true,
        remainingTime: 30,
        lastUpdate: new Date(),
      },
    });

    mockStopSimplePump.mockResolvedValue({
      success: true,
      message: "Pump stopped successfully",
    });

    render(<SimplePumpQuickControl />);

    await waitFor(() => {
      expect(screen.getByText("Parar Irrigação")).toBeInTheDocument();
    });

    const stopButton = screen.getByText("Parar Irrigação");
    await user.click(stopButton);

    await waitFor(() => {
      expect(mockStopSimplePump).toHaveBeenCalledWith("192.168.1.100");
    });
  });
});
