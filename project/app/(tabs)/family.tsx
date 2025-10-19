import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { Mail, Phone, Home } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';
import { api } from '@/lib/api';
import { Member, Household } from '@/types/database';

export default function FamilyScreen() {
  const [member, setMember] = useState<Member | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { config } = useChurchConfig();

  const primaryColor = config?.primaryColor || '#C41E3A';

  useEffect(() => {
    fetchMember();
  }, [user]);

  const fetchMember = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const allMembers = await api.getMembers();
      const userMember = allMembers.find((m: Member) => m.email === user.email);
      if (userMember) {
        setMember(userMember);
        if (userMember.householdId) {
          await fetchHousehold(userMember.householdId, allMembers);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load member information');
    } finally {
      setLoading(false);
    }
  };

  const fetchHousehold = async (householdId: string, allMembers: Member[]) => {
    try {
      const members = allMembers.filter((m: Member) => m.householdId === householdId);
      setHouseholdMembers(members);

      const households = await api.getAllHouseholds();
      const userHousehold = households.find((h: Household) => h.id === householdId);
      if (userHousehold) {
        setHousehold(userHousehold);
      } else {
        console.warn(`Household with ID ${householdId} not found in households list`);
      }
    } catch (err) {
      console.error('Failed to load household information:', err);
      Alert.alert('Error', 'Failed to load household information. Some data may be incomplete.');
    }
  };

  const formatBirthDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const formatWeddingDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const formatPhone = (phone: string | null) => {
    return phone || 'N/A';
  };

  const renderMember = (memberData: Member) => {
    const initials = `${memberData.firstName.charAt(0)}${memberData.lastName.charAt(0)}`.toUpperCase();

    return (
      <View key={memberData.memberId} style={styles.memberRow}>
        <View style={[styles.memberAvatar, { backgroundColor: primaryColor }]}>
          <Text style={styles.memberAvatarText}>{initials}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberText}>
            {memberData.firstName} {memberData.lastName}
          </Text>
          {memberData.relationship && (
            <Text style={styles.memberRelationship}>{memberData.relationship}</Text>
          )}
          {memberData.email && (
            <View style={styles.memberContactItem}>
              <Mail size={12} color="#888" />
              <Text style={styles.memberContactText}>{memberData.email}</Text>
            </View>
          )}
          {memberData.phone && (
            <View style={styles.memberContactItem}>
              <Phone size={12} color="#888" />
              <Text style={styles.memberContactText}>{memberData.phone}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          {config?.logo_url ? (
            <Image source={{ uri: config.logo_url }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={[styles.logoPlaceholder, { borderColor: '#FFFFFF' }]}>
              <Text style={styles.logoText}>Church</Text>
            </View>
          )}
          <Text style={styles.churchName}>{config?.church_name || 'Church Management'}</Text>
          <Text style={styles.headerTitle}>My Family</Text>
        </View>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No member information found for your account.</Text>
          <Text style={styles.noDataSubtext}>Please contact the church administrator.</Text>
        </View>
      </View>
    );
  }

  const householdInitials = household?.familyName 
    ? household.familyName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        {config?.logoUrl ? (
          <Image source={{ uri: config.logoUrl }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={[styles.logoPlaceholder, { borderColor: '#FFFFFF' }]}>
            <Text style={styles.logoText}>Church</Text>
          </View>
        )}
        <Text style={styles.churchName}>{config?.churchName || 'Church Management'}</Text>
        <Text style={styles.headerTitle}>My Family</Text>
      </View>

      {household && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Household Information</Text>
          </View>

          <View style={styles.householdInfo}>
            <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
              <Text style={styles.avatarText}>{householdInitials}</Text>
            </View>
            <View style={styles.householdDetails}>
              <Text style={styles.householdName}>{household.familyName}</Text>
              {household.email && (
                <View style={styles.contactItem}>
                  <Mail size={14} color="#666" />
                  <Text style={styles.contactText}>{household.email}</Text>
                </View>
              )}
              {household.phone && (
                <View style={styles.contactItem}>
                  <Phone size={14} color="#666" />
                  <Text style={styles.contactText}>{household.phone}</Text>
                </View>
              )}
              {household.prayerGroup && (
                <View style={styles.contactItem}>
                  <Home size={14} color="#666" />
                  <Text style={styles.contactText}>{household.prayerGroup}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {householdMembers.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Household Members</Text>
          </View>

          <View style={styles.membersList}>
            {householdMembers.map(renderMember)}
          </View>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  logoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  churchName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoContainer: {
    gap: 16,
  },
  infoRow: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  householdInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  householdDetails: {
    flex: 1,
  },
  householdName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
  },
  membersList: {
    gap: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingLeft: 8,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  memberRelationship: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  memberContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  memberContactText: {
    fontSize: 12,
    color: '#888',
  },
});
