import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChurchConfigProvider } from '@/contexts/ChurchConfigContext';

function RootLayoutNav() {
  const { user, loading, needsProfileCompletion, isPendingApproval, isApproved, isSuspended } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const currentSegment = segments[0];

    if (!user) {
      if (inAuthGroup) {
        router.replace('/login');
      }
    } else {
      // Priority order: suspended > profile completion > pending approval > approved
      // Suspended users always go to account-suspended, regardless of other states
      if (isSuspended) {
        if (currentSegment !== 'account-suspended') {
          router.replace('/account-suspended');
        }
      } else if (needsProfileCompletion) {
        if (currentSegment !== 'complete-profile') {
          router.replace('/complete-profile');
        }
      } else if (isPendingApproval) {
        if (currentSegment !== 'pending-approval') {
          router.replace('/pending-approval');
        }
      } else if (isApproved && !inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [user, segments, loading, needsProfileCompletion, isPendingApproval, isApproved, isSuspended]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="complete-profile" />
      <Stack.Screen name="pending-approval" />
      <Stack.Screen name="account-suspended" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ChurchConfigProvider>
      <AuthProvider>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </AuthProvider>
    </ChurchConfigProvider>
  );
}
