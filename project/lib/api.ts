const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  
  return '/api';
};

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace('/api', '');
  }
  
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  return '';
};

const API_URL = getApiUrl();

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  getLoginUrl(): string {
    return `${getBaseUrl()}/api/auth/login`;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async signOut() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async completeProfile(firstName: string, lastName: string, donorNumber: string) {
    return this.request('/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, donorNumber }),
    });
  }

  async getConfig() {
    return this.request('/config');
  }

  async getHousehold() {
    return this.request('/households');
  }

  async getAllHouseholds() {
    return this.request('/households/directory');
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

  async getMembers(search?: string) {
    const queryParams = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/members${queryParams}`);
  }

  async getDonations(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const queryString = params.toString();
    return this.request(`/donations${queryString ? `?${queryString}` : ''}`);
  }

  async getAnnouncements() {
    return this.request('/announcements');
  }

  async getContacts() {
    return this.request('/contacts');
  }

  async updateDonorNumber(donorNumber: string) {
    return this.request('/auth/update-donor-number', {
      method: 'PUT',
      body: JSON.stringify({ donorNumber }),
    });
  }
}

export const api = new ApiClient();
