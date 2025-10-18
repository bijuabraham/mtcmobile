import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';
import { supabase } from '@/lib/supabase';
import { Member } from '@/types/database';

export default function FamilyScreen() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { config } = useChurchConfig();

  const primaryColor = config?.primary_color || '#C41E3A';

  useEffect(() => {
    fetchMember();
  }, [user]);

  const fetchMember = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setMember(data);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load member information');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatPhone = (phone: string | null) => {
    return phone || 'N/A';
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Member Information</Text>
        </View>

        <View style={styles.photoContainer}>
          <View style={[styles.photoPlaceholder, { backgroundColor: primaryColor }]}>
            <Text style={styles.photoPlaceholderText}>
              {member.firstname.charAt(0).toUpperCase()}{member.lastname.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>First Name</Text>
            <Text style={styles.value}>{member.firstname}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Last Name</Text>
            <Text style={styles.value}>{member.lastname}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Relationship</Text>
            <Text style={styles.value}>{member.relationship || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Birth Date</Text>
            <Text style={styles.value}>{formatDate(member.birth_date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Wedding Date</Text>
            <Text style={styles.value}>{formatDate(member.wed_date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{formatPhone(member.phone)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{member.email || 'N/A'}</Text>
          </View>
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
});
