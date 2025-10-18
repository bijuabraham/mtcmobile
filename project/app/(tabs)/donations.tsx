import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, Image } from 'react-native';
import { Calendar, DollarSign, Printer, ExternalLink } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';
import { supabase } from '@/lib/supabase';
import { Donation } from '@/types/database';

export default function DonationsScreen() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const { user } = useAuth();
  const { config } = useChurchConfig();

  const primaryColor = config?.primary_color || '#C41E3A';

  useEffect(() => {
    fetchDonations();
  }, [user]);

  useEffect(() => {
    filterDonations();
  }, [donations, startDate, endDate]);

  const fetchDonations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('user_id', user.id)
        .order('donation_date', { ascending: false });

      if (error) throw error;

      setDonations(data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  const filterDonations = () => {
    let filtered = [...donations];

    if (startDate) {
      filtered = filtered.filter(
        (d) => new Date(d.donation_date) >= startDate
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (d) => new Date(d.donation_date) <= endDate
      );
    }

    setFilteredDonations(filtered);
  };

  const setQuickFilter = (months: number | null) => {
    if (months === null) {
      setStartDate(null);
      setEndDate(null);
    } else {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - months);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const getTotalAmount = () => {
    return filteredDonations.reduce((sum, donation) => sum + Number(donation.amount), 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handlePrint = () => {
    Alert.alert(
      'Print Donations',
      'Print functionality requires a printer or PDF export. Would you like to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => Alert.alert('Info', 'Print feature coming soon') },
      ]
    );
  };

  const handleStandardPayments = () => {
    const url = config?.api_endpoints?.standardPayments || 'https://marthomasf.org/standard-payments/';
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open the link');
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Donations</Text>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Date Range Filter</Text>
        <View style={styles.quickFilters}>
          <TouchableOpacity
            style={[styles.filterButton, !startDate && !endDate && styles.filterButtonActive]}
            onPress={() => setQuickFilter(null)}
          >
            <Text style={styles.filterButtonText}>All Time</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setQuickFilter(3)}
          >
            <Text style={styles.filterButtonText}>3 Months</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setQuickFilter(6)}
          >
            <Text style={styles.filterButtonText}>6 Months</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setQuickFilter(12)}
          >
            <Text style={styles.filterButtonText}>1 Year</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Donations</Text>
          <Text style={[styles.summaryValue, { color: primaryColor }]}>
            {formatCurrency(getTotalAmount())}
          </Text>
          <Text style={styles.summaryCount}>
            {filteredDonations.length} {filteredDonations.length === 1 ? 'donation' : 'donations'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: primaryColor }]}
          onPress={handlePrint}
        >
          <Printer size={20} color={primaryColor} />
          <Text style={[styles.actionButtonText, { color: primaryColor }]}>Print Records</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: primaryColor }]}
          onPress={handleStandardPayments}
        >
          <ExternalLink size={20} color="#FFFFFF" />
          <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
            Standard Payments
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {filteredDonations.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign size={64} color="#CCC" />
            <Text style={styles.emptyStateTitle}>No donations found</Text>
            <Text style={styles.emptyStateText}>
              {donations.length === 0
                ? 'Your donation history will appear here'
                : 'Try adjusting your date filter'}
            </Text>
          </View>
        ) : (
          filteredDonations.map((donation) => (
            <View key={donation.id} style={styles.donationCard}>
              <View style={styles.donationHeader}>
                <Text style={styles.donationAmount}>{formatCurrency(Number(donation.amount))}</Text>
                <Text style={styles.donationDate}>{formatDate(donation.donation_date)}</Text>
              </View>
              <View style={styles.donationDetails}>
                <View style={styles.donationDetailRow}>
                  <Text style={styles.donationDetailLabel}>Category:</Text>
                  <Text style={styles.donationDetailValue}>{donation.category}</Text>
                </View>
                <View style={styles.donationDetailRow}>
                  <Text style={styles.donationDetailLabel}>Payment Method:</Text>
                  <Text style={styles.donationDetailValue}>{donation.payment_method}</Text>
                </View>
                {donation.description && (
                  <View style={styles.donationDetailRow}>
                    <Text style={styles.donationDetailLabel}>Note:</Text>
                    <Text style={styles.donationDetailValue}>{donation.description}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  filterContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#C41E3A',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  summaryContainer: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 14,
    color: '#999',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  donationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  donationAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  donationDate: {
    fontSize: 14,
    color: '#666',
  },
  donationDetails: {
    gap: 8,
  },
  donationDetailRow: {
    flexDirection: 'row',
  },
  donationDetailLabel: {
    fontSize: 14,
    color: '#999',
    width: 120,
  },
  donationDetailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
