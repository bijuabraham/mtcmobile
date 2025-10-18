import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async signUp(email: string, password: string) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await AsyncStorage.setItem('auth_token', data.token);
    return data;
  }

  async signIn(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await AsyncStorage.setItem('auth_token', data.token);
    return data;
  }

  async signOut() {
    await AsyncStorage.removeItem('auth_token');
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Config endpoints
  async getConfig() {
    return this.request('/config');
  }

  // Household endpoints
  async getHousehold() {
    return this.request('/households');
  }

  async createHousehold(data: any) {
    return this.request('/households', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHousehold(data: any) {
    return this.request('/households', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Member endpoints
  async getMembers(search?: string) {
    const queryParams = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/members${queryParams}`);
  }

  // Donation endpoints
  async getDonations(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const queryString = params.toString();
    return this.request(`/donations${queryString ? `?${queryString}` : ''}`);
  }

  // Announcement endpoints
  async getAnnouncements() {
    return this.request('/announcements');
  }

  // Contact endpoints
  async getContacts() {
    return this.request('/contacts');
  }
}

export const api = new ApiClient();
