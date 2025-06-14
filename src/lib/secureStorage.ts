import CryptoJS from 'crypto-js';

// Get encryption key from environment or generate one
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production';

interface StorageData {
  value: any;
  timestamp: number;
  expires?: number;
}

class SecureStorage {
  private encrypt(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }

  private decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData;
    }
  }

  setItem(key: string, value: any, expiresInMinutes?: number): void {
    try {
      const data: StorageData = {
        value,
        timestamp: Date.now(),
        expires: expiresInMinutes ? Date.now() + (expiresInMinutes * 60 * 1000) : undefined
      };

      const encryptedData = this.encrypt(JSON.stringify(data));
      sessionStorage.setItem(key, encryptedData);
    } catch (error) {
      console.error('Failed to store data:', error);
    }
  }

  getItem(key: string): any {
    try {
      const encryptedData = sessionStorage.getItem(key);
      if (!encryptedData) return null;

      const decryptedData = this.decrypt(encryptedData);
      if (!decryptedData) return null;

      const data: StorageData = JSON.parse(decryptedData);

      // Check if data has expired
      if (data.expires && Date.now() > data.expires) {
        this.removeItem(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  clear(): void {
    sessionStorage.clear();
  }

  // Auth token methods
  setAuthToken(token: string, expiresInMinutes: number = 60): void {
    this.setItem('auth_token', token, expiresInMinutes);
  }

  getAuthToken(): string | null {
    return this.getItem('auth_token');
  }

  removeAuthToken(): void {
    this.removeItem('auth_token');
  }

  // User data methods
  setUserData(userData: any): void {
    this.setItem('user_data', userData, 60 * 24); // 24 hours
  }

  getUserData(): any {
    return this.getItem('user_data');
  }

  removeUserData(): void {
    this.removeItem('user_data');
  }

  // Legacy compatibility
  setToken(token: string, expiresInMinutes: number = 60): void {
    this.setAuthToken(token, expiresInMinutes);
  }

  getToken(): string | null {
    return this.getAuthToken();
  }

  removeToken(): void {
    this.removeAuthToken();
  }
}

// Migration function for localStorage to secure storage
export const migrateFromLocalStorage = (): void => {
  try {
    // Migrate auth token
    const oldToken = localStorage.getItem('auth_token');
    if (oldToken) {
      secureStorage.setAuthToken(oldToken);
      localStorage.removeItem('auth_token');
    }

    // Migrate user data
    const oldUserData = localStorage.getItem('user_data');
    if (oldUserData) {
      try {
        const userData = JSON.parse(oldUserData);
        secureStorage.setUserData(userData);
        localStorage.removeItem('user_data');
      } catch (error) {
        console.warn('Failed to migrate user data from localStorage');
      }
    }

    console.log('Successfully migrated data from localStorage to secure storage');
  } catch (error) {
    console.warn('Migration from localStorage failed:', error);
  }
};

export const secureStorage = new SecureStorage();
export default secureStorage;