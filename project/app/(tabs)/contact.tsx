import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, Image } from 'react-native';
import { Phone, Mail, MapPin } from 'lucide-react-native';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';

interface ExecutiveBoardMember {
  position: string;
  name: string;
  phone?: string;
  email?: string;
}

export default function ContactScreen() {
  const [loading, setLoading] = useState(false);
  const { config } = useChurchConfig();

  const primaryColor = config?.primaryColor || '#C41E3A';

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const openMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    Linking.openURL(url).catch(err => console.error('Error opening maps:', err));
  };

  const renderContactRow = (icon: React.ReactNode, text: string, onPress: () => void) => (
    <TouchableOpacity style={styles.contactRow} onPress={onPress}>
      {icon}
      <Text style={[styles.contactText, { color: primaryColor }]}>
        {text}
      </Text>
    </TouchableOpacity>
  );

  const renderBoardMember = (member: ExecutiveBoardMember) => (
    <View key={member.position} style={styles.boardMemberCard}>
      <Text style={styles.boardPosition}>{member.position}</Text>
      <Text style={styles.boardName}>{member.name}</Text>
      
      {member.phone && renderContactRow(
        <Phone size={18} color={primaryColor} />,
        member.phone,
        () => handlePhonePress(member.phone!)
      )}
      
      {member.email && renderContactRow(
        <Mail size={18} color={primaryColor} />,
        member.email,
        () => handleEmailPress(member.email!)
      )}
    </View>
  );

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
      </View>

      <View style={styles.content}>
        {/* Vicar Section */}
        {config?.vicarName && (
          <View style={styles.vicarSection}>
            <Text style={styles.sectionTitle}>Vicar</Text>
            <View style={styles.vicarCard}>
              {config.vicarPhotoUrl && (
                <Image 
                  source={{ uri: config.vicarPhotoUrl }} 
                  style={styles.vicarPhoto} 
                  resizeMode="cover"
                />
              )}
              <View style={styles.vicarInfo}>
                <Text style={styles.vicarName}>{config.vicarName}</Text>
                
                {config.vicarPhone && renderContactRow(
                  <Phone size={20} color={primaryColor} />,
                  config.vicarPhone,
                  () => handlePhonePress(config.vicarPhone!)
                )}
                
                {config.vicarEmail && renderContactRow(
                  <Mail size={20} color={primaryColor} />,
                  config.vicarEmail,
                  () => handleEmailPress(config.vicarEmail!)
                )}
              </View>
            </View>
          </View>
        )}

        {/* Church Address Section */}
        {config?.churchAddress && (
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Church Address</Text>
            <TouchableOpacity 
              style={styles.addressCard}
              onPress={() => openMaps(config.churchAddress!)}
              activeOpacity={0.7}
            >
              <MapPin size={24} color={primaryColor} />
              <Text style={[styles.addressText, { color: primaryColor }]}>
                {config.churchAddress}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Executive Board Section */}
        {config?.executiveBoard && config.executiveBoard.length > 0 && (
          <View style={styles.boardSection}>
            <Text style={styles.sectionTitle}>Executive Board</Text>
            {config.executiveBoard.map(renderBoardMember)}
          </View>
        )}
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
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  vicarSection: {
    marginBottom: 24,
  },
  vicarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vicarPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 16,
  },
  vicarInfo: {
    alignItems: 'center',
  },
  vicarName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 12,
    textDecorationLine: 'underline',
  },
  addressSection: {
    marginBottom: 24,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    textDecorationLine: 'underline',
  },
  boardSection: {
    marginBottom: 24,
  },
  boardMemberCard: {
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
  boardPosition: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  boardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
});
