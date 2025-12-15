import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import { ArrowRight, Globe, Lock, Mail } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LanguageModal from '../components/LanguageModal';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { user, error: authError } = useAuth() as any;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Dark mode detection
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Sync auth error to local state
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // If user is logged in, show loading (layout will handle redirect)
  if (user) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-100 dark:bg-slate-900">
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color={isDark ? "#60a5fa" : "#0f172a"} />
      </View>
    );
  }

  const handleEmailLogin = async () => {
    setError('');

    if (!email) {
      setError(t('error.emptyEmail'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('error.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      // Calling your existing backend endpoint
      const res = await api.post('/users/Login_SignUp/', { email: email });

      console.log("Login Response:", res.data);
      console.log("Login Response Headers:", res.headers); // Debugging
      let cookie: any = res.headers['set-cookie'];

      // If it's an array (common in React Native), join it into a string
      if (Array.isArray(cookie)) {
        cookie = cookie.join('; ');
      }
      // Navigate to Verify screen
      // Use standard navigation.navigate for safety if useRouter is buggy
      (navigation as any).navigate('verify', {
        key: res.data.key,
        id: res.data.id,
        email: email,
        cookie: cookie || '' // <--- Pass the cookie here
      });

    } catch (err: any) {
      console.error("Login failed:", err);
      const errorMessage = err?.res?.data?.error || t('error.connection');
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      // Background Gradient - Dark mode aware
      colors={isDark ? ['#0f172a', '#1e293b', '#334155'] : ['#f8fafc', '#e2e8f0', '#cbd5e1']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center px-6"
        >
          {/* Language Switcher Button (Top Right) */}
          <View className="absolute top-4 right-0 z-50">
            <TouchableOpacity
              onPress={() => setShowLanguageModal(true)}
              className="bg-white/80 dark:bg-slate-700/80 p-2.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-600"
            >
              <Globe size={22} color={isDark ? "#94a3b8" : "#475569"} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>

            {/* Main Card Container */}
            <View className="bg-white/95 dark:bg-slate-800/95 p-8 rounded-3xl shadow-2xl backdrop-blur-md border border-white/30 dark:border-slate-700/50">

              {/* Header / Logo Section */}
              <View className="items-center mb-8">
                <View className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 p-2 rounded-full mb-5 shadow-lg">
                  <Image
                    source={require('../assets/logo.png')} // Replace with your ms.png
                    className="w-[90px] h-[90px]"
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-3xl font-extrabold text-slate-800 dark:text-white text-center tracking-tight">
                  Setu Partner
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 italic mt-1 text-base">
                  {t('slogan')}
                </Text>

                <View className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full mt-5 border border-slate-200 dark:border-slate-600">
                  <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {t('welcomeBack')}
                  </Text>
                </View>
              </View>

              {/* Error Message Display */}
              {error ? (
                <View className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-5 rounded-r-xl">
                  <Text className="text-red-700 dark:text-red-400 font-medium">{error}</Text>
                </View>
              ) : null}

              {/* Form Section */}
              <View className="space-y-5">

                {/* DEBUG TOOL: Remove in production */}
                <TouchableOpacity
                  onPress={async () => {
                    const cookie = await import('expo-secure-store').then(s => s.getItemAsync('session_cookie'));
                    console.log("=== DIAGNOSTICS ===");
                    console.log("SecureStore Cookie:", cookie);
                    const isApiHealthy = await api.get('').catch(e => e.message);
                    console.log("API Health Check:", isApiHealthy);
                    Alert.alert("Debug Info", `Cookie present: ${!!cookie}\nSee logs for details.`);
                  }}
                  className="self-center mb-3 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full"
                >
                  <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">🔧 Run Diagnostics</Text>
                </TouchableOpacity>

                {/* Email Input - Redesigned */}
                <View>
                  <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-3 ml-1 text-base">
                    {t('enterEmail')}
                  </Text>

                  {/* Modern Input Container */}
                  <View className={`
                    relative flex-row items-center 
                    bg-slate-50 dark:bg-slate-700/50 
                    rounded-2xl 
                    border-2 
                    ${isFocused
                      ? 'border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/20'
                      : 'border-slate-200 dark:border-slate-600'
                    }
                    transition-all duration-200
                  `}>
                    {/* Icon Container */}
                    <View className={`
                      absolute left-0 z-10 
                      h-full px-4 
                      justify-center items-center
                      border-r border-slate-200 dark:border-slate-600
                      bg-slate-100 dark:bg-slate-600/50
                      rounded-l-2xl
                    `}>
                      <Mail size={20} color={isFocused ? (isDark ? "#60a5fa" : "#2563eb") : (isDark ? "#94a3b8" : "#64748b")} />
                    </View>

                    <TextInput
                      className="flex-1 bg-transparent py-4 pl-16 pr-4 text-slate-800 dark:text-white text-base font-medium"
                      placeholder={t('emailPlaceholder')}
                      placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                    />
                  </View>

                  {/* Hint Text */}
                  <View className="flex-row items-center mt-3 ml-1">
                    <Lock size={12} color={isDark ? "#64748b" : "#94a3b8"} />
                    <Text className="text-xs text-slate-400 dark:text-slate-500 ml-1.5">
                      {t('emailHint')}
                    </Text>
                  </View>
                </View>

                {/* Submit Button - Redesigned */}
                <TouchableOpacity
                  onPress={handleEmailLogin}
                  disabled={loading}
                  className={`
                    w-full py-4 rounded-2xl flex-row justify-center items-center mt-2
                    ${loading || !email
                      ? 'bg-slate-300 dark:bg-slate-600'
                      : 'bg-blue-600 dark:bg-blue-500 shadow-lg shadow-blue-500/30'
                    }
                  `}
                  style={{ elevation: loading || !email ? 0 : 4 }}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator color="white" className="mr-2" />
                      <Text className="text-white font-bold text-lg">{t('sending')}</Text>
                    </>
                  ) : (
                    <>
                      <Text className="text-white font-bold text-lg mr-2">{t('continue')}</Text>
                      <View className="bg-white/20 p-1 rounded-full">
                        <ArrowRight size={18} color="white" />
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Footer Links */}
              <View className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Text className="text-center text-slate-500 dark:text-slate-400 text-sm leading-6">
                  {t('agree')}{"\n"}
                  <Text className="text-blue-600 dark:text-blue-400 font-bold">{t('terms')}</Text> {t('and')} <Text className="text-blue-600 dark:text-blue-400 font-bold">{t('privacy')}</Text>
                </Text>
              </View>
            </View>

            {/* Copyright Footer */}
            <Text className="text-center text-slate-400 dark:text-slate-500 text-xs mt-8">
              {t('copyright')}
            </Text>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

    </LinearGradient>
  );
}