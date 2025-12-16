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

function useNavigationGuard() {
  const { user, profile, loading } = useAuth() as AuthContextType;
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();


  useEffect(() => {
    if (loading || !navigationState?.key) return;

    const currentRoute = segments[0] as string | undefined;

    // --- CASE 1: NOT LOGGED IN ---
    if (!user) {
      if (currentRoute !== 'index' && currentRoute !== 'login' && currentRoute !== 'verify') {
        router.replace('/login');
      }
      if ((currentRoute === 'index' || currentRoute === undefined) && !loading) {
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
        if (currentRoute === undefined || currentRoute === 'index' || currentRoute === 'login' || currentRoute === 'verify' || currentRoute === 'unverified' || currentRoute === 'form') {
          router.replace('/(tabs)');
        }
      } else {
        if (currentRoute !== 'unverified') {
          router.replace('/unverified' as any);
        }
      }
    }
  }, [user, profile, loading, segments]);
}

function RootLayoutContent() {
  const { loading } = useAuth() as AuthContextType;

  // Use the navigation guard hook
  useNavigationGuard();

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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="index" />
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



