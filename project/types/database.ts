export interface ChurchConfiguration {
  id: string;
  church_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  api_endpoints: {
    iconcmo: string;
    announcements: string;
    standardPayments: string;
  };
  calendar_id: string;
  created_at: string;
  updated_at: string;
}

export interface Household {
  household_id: string;
  mail_to: string;
  phone: string | null;
  email: string | null;
  donor: string | null;
  prayer_group: 'South Bay' | 'Fremont' | 'Trivalley' | 'Central Valley' | 'San Francisco' | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  member_id: string;
  household_id: string | null;
  firstname: string;
  lastname: string;
  birth_date: string | null;
  wed_date: string | null;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  donor_id: string | null;
  prayer_group: string | null;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  user_id: string;
  amount: number;
  donation_date: string;
  category: string;
  description: string | null;
  payment_method: string;
  created_at: string;
  updated_at: string;
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
