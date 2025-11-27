import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';

export default function PendingApprovalScreen() {
  const [checking, setChecking] = useState(false);
  const { user, checkAuth, signOut, isApproved } = useAuth();
  const { config } = useChurchConfig();
  const router = useRouter();

  useEffect(() => {
    if (isApproved) {
      router.replace('/(tabs)');
    }
  }, [isApproved, router]);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      await checkAuth();
    } finally {
      setChecking(false);
    }
  };

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
          <View style={[styles.clockIcon, { borderColor: primaryColor }]}>
            <Text style={[styles.clockIconText, { color: primaryColor }]}>&#8986;</Text>
          </View>
        </View>

        <Text style={styles.title}>Pending Approval</Text>
        
        <Text style={styles.message}>
          Thank you for registering! Your account is currently pending approval from a church administrator.
        </Text>

        {user && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Registered Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
            
            {user.firstName && user.lastName && (
              <>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{user.firstName} {user.lastName}</Text>
              </>
            )}
            
            {user.donorNumber && (
              <>
                <Text style={styles.infoLabel}>Donor Number</Text>
                <Text style={styles.infoValue}>{user.donorNumber}</Text>
              </>
            )}
          </View>
        )}

        <Text style={styles.helperText}>
          You will be able to access the app once an administrator approves your registration.
          You can check back later or contact the church office if you have questions.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: primaryColor }]}
          onPress={handleCheckStatus}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Check Status</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutButton}
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  iconContainer: {
    marginBottom: 24,
  },
  clockIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
  },
  clockIconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
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
  infoBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  helperText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: 24,
    padding: 12,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
