import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch, Image } from 'react-native';
import { LogOut, User, Bell, Globe } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { user, signOut } = useAuth();
  const { config } = useChurchConfig();

  const primaryColor = config?.primaryColor || '#C41E3A';

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
      setSigningOut(false);
      setShowSignOutConfirm(false);
    }
  };

  const saveNotificationSettings = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
  };

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
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <User size={20} color={primaryColor} />
          <Text style={styles.sectionTitle}>Account Information</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>{user?.id.substring(0, 8)}...</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Bell size={20} color={primaryColor} />
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={saveNotificationSettings}
              trackColor={{ false: '#E0E0E0', true: primaryColor }}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Globe size={20} color={primaryColor} />
          <Text style={styles.sectionTitle}>About</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Church</Text>
            <Text style={styles.infoValue}>{config?.church_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        {!showSignOutConfirm ? (
          <TouchableOpacity
            style={[styles.signOutButton, { borderColor: '#D32F2F' }]}
            onPress={() => setShowSignOutConfirm(true)}
          >
            <LogOut size={20} color="#D32F2F" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.card}>
            <Text style={styles.confirmText}>Are you sure you want to sign out?</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowSignOutConfirm(false)}
                disabled={signingOut}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={handleSignOut}
                disabled={signingOut}
              >
                <Text style={styles.primaryButtonText}>
                  {signingOut ? 'Signing Out...' : 'Sign Out'}
                </Text>
              </TouchableOpacity>
            </View>
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
  contentContainer: {
    paddingBottom: 40,
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
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D32F2F',
  },
  confirmText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  dangerButton: {
    backgroundColor: '#D32F2F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
