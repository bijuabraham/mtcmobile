import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image, useWindowDimensions, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, DollarSign, Calendar, Settings, UserCircle, Phone } from 'lucide-react-native';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import RenderHTML from 'react-native-render-html';
import { Announcement, Member } from '@/types/database';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

export default function HomeScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const { config, refreshConfig } = useChurchConfig();
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const primaryColor = config?.primaryColor || '#C41E3A';
  const secondaryColor = config?.secondaryColor || '#FFD700';

  useEffect(() => {
    fetchAnnouncements();
    fetchMember();
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncement(true);
      const data = await api.getAnnouncements();
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncement(false);
    }
  };

  const fetchMember = async () => {
    if (!user?.email) return;
    
    try {
      const allMembers = await api.getMembers();
      const userMember = allMembers.find((m: Member) => m.email === user.email);
      if (userMember) {
        setMember(userMember);
      }
    } catch (err) {
      console.error('Error fetching member:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshConfig(),
      fetchAnnouncements(),
      fetchMember()
    ]);
    setRefreshing(false);
  };

  const menuItems: MenuItem[] = [
    {
      id: 'family',
      title: 'Family',
      icon: <UserCircle size={24} color="#FFFFFF" />,
      route: '/(tabs)/family',
      color: primaryColor,
    },
    {
      id: 'directory',
      title: 'Directory',
      icon: <Users size={24} color="#FFFFFF" />,
      route: '/(tabs)/directory',
      color: '#2196F3',
    },
    {
      id: 'donations',
      title: 'Donations',
      icon: <DollarSign size={24} color="#FFFFFF" />,
      route: '/(tabs)/donations',
      color: '#4CAF50',
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: <Calendar size={24} color="#FFFFFF" />,
      route: '/(tabs)/calendar',
      color: '#FF9800',
    },
    {
      id: 'contact',
      title: 'Contact',
      icon: <Phone size={24} color="#FFFFFF" />,
      route: '/(tabs)/contact',
      color: '#00BCD4',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Settings size={24} color="#FFFFFF" />,
      route: '/(tabs)/settings',
      color: '#9C27B0',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={primaryColor}
          colors={[primaryColor]}
        />
      }
    >
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        {config?.logoUrl ? (
          <Image
            source={{ uri: config.logoUrl }}
            style={styles.logo}
            resizeMode="contain"
            key={config.logoUrl}
          />
        ) : (
          <View style={[styles.logoPlaceholder, { borderColor: '#FFFFFF' }]}>
            <Text style={styles.logoText}>Church</Text>
          </View>
        )}
        <Text style={styles.churchName}>{config?.churchName || 'Church Management'}</Text>
        <Text style={styles.welcomeText}>
          Welcome, {member ? `${member.firstName} ${member.lastName}` : user?.email?.split('@')[0]}
        </Text>
      </View>

      {!loadingAnnouncement && announcements.length > 0 && (
        <View style={styles.announcementSection}>
          <Text style={styles.announcementTitle}>Announcements</Text>
          {announcements.map((announcement) => (
            <View key={announcement.id} style={styles.announcementContainer}>
              <RenderHTML
                contentWidth={width - 64}
                source={{ html: announcement.content }}
                tagsStyles={{
                  h3: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: 8,
                    marginTop: 0,
                  },
                  p: {
                    fontSize: 14,
                    color: '#666',
                    lineHeight: 20,
                    marginTop: 0,
                    marginBottom: 0,
                  },
                }}
              />
            </View>
          ))}
        </View>
      )}

      <View style={styles.menuContainer}>
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: item.color }]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuIcon}>{item.icon}</View>
              <Text style={styles.menuItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  logoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  churchName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  announcementSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  announcementContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    marginBottom: 8,
  },
  menuItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
