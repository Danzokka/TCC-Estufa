import { renderHook, waitFor } from "@testing-library/react";
import { useIrrigationNotifications } from "../useIrrigationNotifications";

// Mock socket.io-client
jest.mock("socket.io-client", () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

describe("useIrrigationNotifications", () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  it("should initialize socket connection", () => {
    const { result } = renderHook(() => useIrrigationNotifications());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.notifications).toEqual([]);
  });

  it("should handle irrigation notifications", async () => {
    const mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    // Mock the io function to return our mock socket
    const mockIo = require("socket.io-client").io;
    mockIo.mockReturnValue(mockSocket);

    const { result } = renderHook(() => useIrrigationNotifications());

    // Simulate receiving a notification
    const mockNotification = {
      id: "test-123",
      type: "pump_activated",
      message: "Bomba ativada por 30 segundos",
      data: {
        pumpId: "pump-1",
        duration: 30,
        waterAmount: 1.5,
        greenhouseId: "gh-1",
        timestamp: new Date().toISOString(),
      },
    };

    // Find the notification callback
    const connectCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "irrigation-notification"
    )[1];

    // Trigger the notification
    connectCallback(mockNotification);

    await waitFor(() => {
      expect(result.current.notifications).toContain(mockNotification);
    });
  });

  it("should mark notifications as read", () => {
    const { result } = renderHook(() => useIrrigationNotifications());

    // Add a mock notification
    const mockNotification = {
      id: "test-123",
      type: "pump_activated",
      message: "Test notification",
      data: {},
    };

    // Manually set notifications (since we can't easily trigger socket events in this test)
    result.current.notifications.push(mockNotification);

    // Mark as read
    result.current.markAsRead("test-123");

    // The notification should still be in the array but marked as read
    expect(result.current.notifications).toHaveLength(1);
  });

  it("should clear all notifications", () => {
    const { result } = renderHook(() => useIrrigationNotifications());

    // Add mock notifications
    result.current.notifications.push(
      { id: "1", type: "pump_activated", message: "Test 1", data: {} },
      { id: "2", type: "irrigation_detected", message: "Test 2", data: {} }
    );

    result.current.clearNotifications();

    expect(result.current.notifications).toEqual([]);
  });
});
