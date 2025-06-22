// Mock the server actions
export const mockActivatePump = jest.fn();
export const mockStopPump = jest.fn();
export const mockGetPumpStatus = jest.fn();
export const mockGetPumpHistory = jest.fn();
export const mockRegisterDevice = jest.fn();

// Mock Sonner toast
export const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

// Reset all mocks
export const resetAllMocks = () => {
  mockActivatePump.mockReset();
  mockStopPump.mockReset();
  mockGetPumpStatus.mockReset();
  mockGetPumpHistory.mockReset();
  mockRegisterDevice.mockReset();

  Object.values(mockToast).forEach((fn) => fn.mockReset());
};
