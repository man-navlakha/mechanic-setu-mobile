import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { WebSocketProvider } from '../context/WebSocketContext';
import "../global.css";
import "../i18n/i18n";

// Define a minimal type for the AuthContext since it's in JS
interface AuthContextType {
  user: any;
  profile: any;
  loading: boolean;
  login: (userData: any, cookieString?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

function NavigationGuard() {
  const { user, profile, loading } = useAuth() as AuthContextType;
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Wait for auth to be determined AND for navigation state to be initialized
    if (loading || !navigationState?.key) return;

    const currentRoute = segments[0] as string | undefined;

    // --- CASE 1: NOT LOGGED IN ---
    if (!user) {
      if (currentRoute !== 'login' && currentRoute !== 'verify' && currentRoute !== 'index') {
        router.replace('/login');
      }
      return;
    }

    // --- CASE 2: LOGGED IN ---
    if (user) {
      if (!profile) {
        if (currentRoute !== 'form') {
          router.replace('/form');
        }
        return;
      }

      if (profile.is_verified) {
        // Redirect to tabs if on public pages
        if (currentRoute === 'login' || currentRoute === 'verify' || currentRoute === 'unverified' || currentRoute === 'form') {
          router.replace('/(tabs)');
        }
      } else {
        // Force unverified screen if profile exists but not verified
        if (currentRoute !== 'unverified') {
          router.replace('/unverified' as any);
        }
      }
    }
  }, [user, profile, loading, segments, navigationState?.key]);

  return null;
}

function RootLayoutContent() {
  const { loading } = useAuth() as AuthContextType;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <WebSocketProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationGuard />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="verify" />
          <Stack.Screen name="form" />
          <Stack.Screen name="unverified" />
          <Stack.Screen name="job/[id]" />
        </Stack>
      </GestureHandlerRootView>
    </WebSocketProvider>
  );
}

export default function RootLayoutNav() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}



