import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Search, Phone, Mail, UserCircle, Home, ChevronRight, ChevronDown, User } from 'lucide-react-native';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';
import { api } from '@/lib/api';
import { Household, Member } from '@/types/database';

export default function DirectoryScreen() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [filteredHouseholds, setFilteredHouseholds] = useState<Household[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedHouseholds, setExpandedHouseholds] = useState<Set<string>>(new Set());
  const [householdMembers, setHouseholdMembers] = useState<Record<string, Member[]>>({});
  const [loadingMembers, setLoadingMembers] = useState<Set<string>>(new Set());
  const { config } = useChurchConfig();

  const primaryColor = config?.primaryColor || '#C41E3A';

  useEffect(() => {
    fetchHouseholds();
  }, []);

  useEffect(() => {
    filterHouseholds();
  }, [searchQuery, households]);

  const fetchHouseholds = async () => {
    try {
      setLoading(true);
      const data = await api.getAllHouseholds();
      setHouseholds(data || []);
      setFilteredHouseholds(data || []);
    } catch (err) {
      console.error('Failed to load households:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterHouseholds = () => {
    if (!searchQuery.trim()) {
      setFilteredHouseholds(households);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = households.filter(
      (household) =>
        household.familyName.toLowerCase().includes(query) ||
        (household.email && household.email.toLowerCase().includes(query)) ||
        (household.prayerGroup && household.prayerGroup.toLowerCase().includes(query))
    );

    setFilteredHouseholds(filtered);
  };

  const toggleHousehold = async (householdId: string) => {
    const newExpanded = new Set(expandedHouseholds);

    if (newExpanded.has(householdId)) {
      newExpanded.delete(householdId);
    } else {
      newExpanded.add(householdId);

      if (!householdMembers[householdId]) {
        await fetchHouseholdMembers(householdId);
      }
    }

    setExpandedHouseholds(newExpanded);
  };

  const fetchHouseholdMembers = async (householdId: string) => {
    try {
      setLoadingMembers(prev => new Set(prev).add(householdId));

      const data = await api.getMembers();
      const filtered = data.filter((m: Member) => m.householdId === householdId);

      setHouseholdMembers(prev => ({
        ...prev,
        [householdId]: filtered || []
      }));
    } catch (err) {
      console.error('Failed to load household members:', err);
    } finally {
      setLoadingMembers(prev => {
        const newSet = new Set(prev);
        newSet.delete(householdId);
        return newSet;
      });
    }
  };

  const renderMember = (member: Member) => {
    const initials = `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();

    return (
      <View key={member.memberId} style={styles.memberRow}>
        <View style={[styles.memberAvatar, { backgroundColor: primaryColor }]}>
          <Text style={styles.memberAvatarText}>{initials}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberText}>
            {member.firstName} {member.lastName}
          </Text>
          {member.relationship && (
            <Text style={styles.memberRelationship}>{member.relationship}</Text>
          )}
          {member.email && (
            <View style={styles.memberContactItem}>
              <Mail size={12} color="#888" />
              <Text style={styles.memberContactText}>{member.email}</Text>
            </View>
          )}
          {member.phone && (
            <View style={styles.memberContactItem}>
              <Phone size={12} color="#888" />
              <Text style={styles.memberContactText}>{member.phone}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderHousehold = (household: Household) => {
    const initials = household.familyName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const isExpanded = expandedHouseholds.has(household.id);
    const members = householdMembers[household.id] || [];
    const isLoadingMembers = loadingMembers.has(household.id);

    return (
      <View key={household.id} style={styles.memberCard}>
        <TouchableOpacity
          style={styles.memberInfo}
          onPress={() => toggleHousehold(household.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>
              {household.familyName}
            </Text>
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
          <View style={styles.expandIcon}>
            {isExpanded ? (
              <ChevronDown size={24} color="#666" />
            ) : (
              <ChevronRight size={24} color="#666" />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.membersContainer}>
            {isLoadingMembers ? (
              <ActivityIndicator size="small" color={primaryColor} style={styles.memberLoader} />
            ) : members.length === 0 ? (
              <View style={styles.noMembers}>
                <User size={32} color="#CCC" />
                <Text style={styles.noMembersText}>No members in this household</Text>
              </View>
            ) : (
              <View style={styles.membersList}>
                <Text style={styles.membersTitle}>Household Members:</Text>
                {members.map(renderMember)}
              </View>
            )}
          </View>
        )}
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
        <Text style={styles.headerTitle}>Household Directory</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search households..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {filteredHouseholds.length === 0 ? (
          <View style={styles.emptyState}>
            <Home size={64} color="#CCC" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No households found' : 'No households yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? 'Try a different search term'
                : 'Households will appear here once added'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>
              {filteredHouseholds.length} {filteredHouseholds.length === 1 ? 'household' : 'households'} found
            </Text>
            {filteredHouseholds.map(renderHousehold)}
          </>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  memberCard: {
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
  memberInfo: {
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
  memberDetails: {
    flex: 1,
  },
  memberName: {
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
  expandIcon: {
    marginLeft: 8,
  },
  membersContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  memberLoader: {
    paddingVertical: 20,
  },
  noMembers: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  noMembersText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  membersList: {
    gap: 12,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
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
