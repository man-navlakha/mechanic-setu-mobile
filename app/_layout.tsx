import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import "../global.css";


// Define a minimal type for the AuthContext since it's in JS
interface AuthContextType {
  user: any;
  profile: any;
  loading: boolean;
  login: (userData: any, cookieString?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

function RootLayoutNav() {
  const { user, profile, loading } = useAuth() as AuthContextType;
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0] as string;

    // --- CASE 1: NOT LOGGED IN ---
    if (!user) {
      if (currentRoute !== 'index' && currentRoute !== 'verify') {
        router.replace('/');
      }
      return;
    }

    // --- CASE 2: LOGGED IN ---
    if (user) {
      // A. Profile is Null (New User OR Missing Mobile Number)
      if (!profile) {
        // Force them to the Form to complete profile
        if (currentRoute !== 'form') {
          router.replace('/form');
        }
        return;
      }

      // B. Profile Exists (Has Mobile Number) -> Check Verification
      if (profile.is_verified) {
        // Verified -> Go to Dashboard (if on intro screens)
        if (currentRoute === 'index' || currentRoute === 'verify' || currentRoute === 'unverified' || currentRoute === 'form') {
          router.replace('/dashboard');
        }
      } else {
        // Unverified -> Go to Unverified Screen
        if (currentRoute !== 'unverified') {
          router.replace('/unverified' as any);
        }
      }
    }
  }, [user, profile, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="form" />
      <Stack.Screen name="unverified" />
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}