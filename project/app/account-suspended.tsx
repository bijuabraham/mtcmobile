import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';

export default function AccountSuspendedScreen() {
  const { user, signOut } = useAuth();
  const { config } = useChurchConfig();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const primaryColor = config?.primaryColor || '#C41E3A';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          {config?.logoUrl ? (
            <Image source={{ uri: config.logoUrl }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: primaryColor }]}>
              <Text style={styles.logoText}>Church</Text>
            </View>
          )}
        </View>

        <View style={styles.iconContainer}>
          <View style={[styles.suspendedIcon, { borderColor: '#dc3545' }]}>
            <Text style={[styles.suspendedIconText, { color: '#dc3545' }]}>&#9888;</Text>
          </View>
        </View>

        <Text style={styles.title}>Account Suspended</Text>
        
        <Text style={styles.message}>
          Your account has been temporarily suspended. If you believe this is an error, please contact the church administrator.
        </Text>

        <View style={styles.contactBox}>
          <Text style={styles.contactLabel}>Contact Administrator</Text>
          <Text style={styles.contactEmail}>admin@marthomasf.org</Text>
        </View>

        {user && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Account Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
            
            {user.firstName && user.lastName && (
              <>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{user.firstName} {user.lastName}</Text>
              </>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: primaryColor }]}
          onPress={handleSignOut}
        >
          <Text style={[styles.signOutText, { color: primaryColor }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconContainer: {
    marginBottom: 24,
  },
  suspendedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  suspendedIconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  contactBox: {
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  contactLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginTop: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  signOutButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    width: '100%',
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
