import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, checkAuth, getLoginUrl, needsProfileCompletion, isPendingApproval, isApproved, isSuspended } = useAuth();
  const { config } = useChurchConfig();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (isSuspended) {
        router.replace('/account-suspended');
      } else if (needsProfileCompletion) {
        router.replace('/complete-profile');
      } else if (isPendingApproval) {
        router.replace('/pending-approval');
      } else if (isApproved) {
        router.replace('/(tabs)');
      }
    }
  }, [user, needsProfileCompletion, isPendingApproval, isApproved, isSuspended, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const loginUrl = getLoginUrl();
      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl,
        Linking.createURL('/login')
      );
      
      if (result.type === 'success') {
        await checkAuth();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = config?.primaryColor || '#C41E3A';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          {config?.logoUrl ? (
            <Image source={{ uri: config.logoUrl }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: primaryColor }]}>
              <Text style={styles.logoText}>Church</Text>
            </View>
          )}
          <Text style={styles.churchName}>{config?.churchName || 'Church Management'}</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in to access your church community</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.googleButton]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#333" />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Use your Google account to sign in. First-time users will need to complete their profile and wait for admin approval.
          </Text>
        </View>
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
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  churchName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  helperText: {
    fontSize: 13,
    color: '#888',
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});
