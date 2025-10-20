import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';
import { api } from '@/lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const { config } = useChurchConfig();
  const router = useRouter();

  const handleLogin = async () => {
    if (isForgotPassword) {
      // Forgot password flow
      if (!email) {
        setError('Please enter your email address');
        return;
      }

      setLoading(true);
      setError('');

      try {
        await api.forgotPassword(email);
        alert('Password reset link sent! Please check your email.');
        setIsForgotPassword(false);
        setEmail('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send password reset email');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Regular sign in / sign up flow
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await signUp(email, password);
        setError('');
        alert('Account created successfully! Please check your email to verify your account before signing in.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        await signIn(email, password);
        router.replace('/(tabs)');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isSignUp ? 'sign up' : 'sign in'}`);
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = config?.primaryColor || '#C41E3A';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          <Text style={styles.title}>
            {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          {!isForgotPassword && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              {isSignUp && (
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!loading}
                />
              )}
            </>
          )}

          {isForgotPassword && (
            <Text style={styles.helperText}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading 
                ? (isForgotPassword ? 'Sending...' : isSignUp ? 'Creating Account...' : 'Signing In...') 
                : (isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In')
              }
            </Text>
          </TouchableOpacity>

          {!isForgotPassword && !isSignUp && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => {
                setIsForgotPassword(true);
                setError('');
                setPassword('');
              }}
              disabled={loading}
            >
              <Text style={[styles.forgotPasswordText, { color: primaryColor }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              if (isForgotPassword) {
                setIsForgotPassword(false);
              } else {
                setIsSignUp(!isSignUp);
              }
              setError('');
              setPassword('');
              setConfirmPassword('');
            }}
            disabled={loading}
          >
            <Text style={[styles.toggleButtonText, { color: primaryColor }]}>
              {isForgotPassword 
                ? 'Back to Sign In' 
                : isSignUp 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"
              }
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  toggleButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginTop: 12,
    padding: 8,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
});
