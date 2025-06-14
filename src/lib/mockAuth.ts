// Mock authentication service for development/testing
export const mockAuthService = {
  // Mock user data
  mockUser: {
    id: "1",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "admin"
  },

  // Mock login
  async login(email: string, password: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simple validation (accept any email/password for demo)
    if (email && password) {
      return {
        success: true,
        user: { ...this.mockUser, email },
        token: "mock-jwt-token-" + Date.now()
      };
    } else {
      throw new Error("Invalid credentials");
    }
  },

  // Mock registration
  async register(email: string, password: string, firstName?: string, lastName?: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (email && password) {
      return {
        success: true,
        user: {
          ...this.mockUser,
          email,
          firstName: firstName || "New",
          lastName: lastName || "User"
        },
        token: "mock-jwt-token-" + Date.now()
      };
    } else {
      throw new Error("Registration failed");
    }
  },

  // Mock user verification
  async verifyUser() {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockUser;
  },

  // Mock logout
  async logout() {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true };
  }
}; 