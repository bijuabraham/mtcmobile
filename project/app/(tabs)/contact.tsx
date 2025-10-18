import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, Image } from 'react-native';
import { Phone, Mail } from 'lucide-react-native';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';
import { api } from '@/lib/api';
import { ContactUs } from '@/types/database';

export default function ContactScreen() {
  const [contacts, setContacts] = useState<ContactUs[]>([]);
  const [loading, setLoading] = useState(true);
  const { config } = useChurchConfig();

  const primaryColor = config?.primaryColor || '#C41E3A';

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await api.getContacts();
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        {config?.logoUrl ? (
          <Image source={{ uri: config.logoUrl }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={[styles.logoPlaceholder, { borderColor: '#FFFFFF' }]}>
            <Text style={styles.logoText}>Church</Text>
          </View>
        )}
        <Text style={styles.churchName}>{config?.churchName || 'Church Management'}</Text>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <Text style={styles.headerSubtitle}>Get in touch with our team</Text>
      </View>

      <View style={styles.content}>
        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <Text style={styles.contactTitle}>{contact.title}</Text>
            <Text style={styles.contactName}>{contact.name}</Text>

            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => handlePhonePress(contact.phone)}
            >
              <Phone size={20} color={primaryColor} />
              <Text style={[styles.contactText, { color: primaryColor }]}>
                {contact.phone}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => handleEmailPress(contact.email)}
            >
              <Mail size={20} color={primaryColor} />
              <Text style={[styles.contactText, { color: primaryColor }]}>
                {contact.email}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
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
    paddingBottom: 30,
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
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    padding: 16,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 12,
    textDecorationLine: 'underline',
  },
});
