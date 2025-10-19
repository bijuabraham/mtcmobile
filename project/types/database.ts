export interface ChurchConfiguration {
  id: string;
  churchName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  apiEndpoints: {
    iconcmo?: string;
    announcements?: string;
    standardPayments?: string;
  };
  calendarId: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Household {
  id: string;
  householdId: string | null;
  familyName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  donorId: string | null;
  prayerGroup: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  memberId: string;
  householdId: string | null;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  wedDate: string | null;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  isVisible: boolean;
  donorId: string | null;
  prayerGroup: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  userId: string | null;
  householdId: string | null;
  donorNumber: string | null;
  amount: number;
  donationDate: string;
  category: string;
  description: string | null;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  content: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactUs {
  id: string;
  title: string;
  name: string;
  phone: string;
  email: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
