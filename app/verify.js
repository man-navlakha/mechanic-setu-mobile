import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Globe } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LanguageModal from '../components/LanguageModal';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function VerifyScreen() {
    const { login } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const params = useLocalSearchParams();

    // Dark mode detection
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    // State Management
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [otp, setOtp] = useState(new Array(6).fill(''));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);

    // Timer State
    const [timer, setTimer] = useState(120);
    const [isResendDisabled, setIsResendDisabled] = useState(true);

    // Refs for the 6 inputs to manage focus
    const inputRefs = useRef([]);

    // Context data (ID and Key are critical for verification)
    const [ctx, setCtx] = useState({
        key: params.key || null,
        id: params.id || null,
        status: params.status || null,
        email: params.email || null,
    });

    const sessionCookie = params.cookie;

    // Timer Logic
    useEffect(() => {
        let interval;
        if (isResendDisabled && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setIsResendDisabled(false);
        }
        return () => clearInterval(interval);
    }, [isResendDisabled, timer]);

    // Handle Input Change
    const handleChange = (text, index) => {
        // Only allow numbers
        if (isNaN(text)) return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto-focus next input if typing a number
        if (text.length === 1 && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle Backspace
    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace') {
            // If current box is empty, move to previous
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
                // Clear previous box value
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
            }
        }
    };

    // 1. Verify OTP Function
    const verifyOtp = async () => {
        setError('');
        const code = otp.join('');

        if (code.length !== 6) {
            setError('Please enter the full 6-digit code.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                key: ctx.key,
                id: ctx.id,
                otp: otp.join('')
            };

            console.log("[Verify] Session Cookie from params:", sessionCookie);
            console.log("[Verify] Sending OTP verification...");

            // 2. ATTACH THE COOKIE TO THE HEADERS
            const verifyRes = await api.post('/users/otp-verify/', payload, {
                headers: {
                    'Cookie': sessionCookie // <--- Send it back to the server
                }
            });

            console.log("[Verify] Response Status:", verifyRes.status);
            console.log("[Verify] Response Headers:", verifyRes.headers);

            // Check if verify response has a new cookie
            let newCookie = verifyRes.headers['set-cookie'];
            if (Array.isArray(newCookie)) {
                newCookie = newCookie.join('; ');
            }
            console.log("[Verify] New Cookie from verify response:", newCookie);

            // Use the cookie from verify response if available, otherwise use the one from login
            const cookieToSave = newCookie || sessionCookie || params.cookie;
            console.log("[Verify] Cookie to save:", cookieToSave);

            await login(
                { id: ctx.id, status: ctx.status }, // User Data
                cookieToSave // Cookie to save
            );

            // Navigate
            if (ctx.status === 'New User') {
                router.replace('/form');
            } else {
                router.replace('/dashboard');
            }

        } catch (err) {
            console.error('[Verify] Error:', err.response?.status, err.response?.data);
            setError('Verification failed. Session may have expired.');
        } finally {
            setLoading(false);
        }
    };

    // 2. Resend OTP Function
    const resendOtp = async () => {
        if (isResendDisabled) return;
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/users/resend-otp/', { key: ctx.key, id: ctx.id });

            // Update Context with new keys if backend rotates them
            if (res.data.key) setCtx(prev => ({ ...prev, key: res.data.key }));
            if (res.data.id) setCtx(prev => ({ ...prev, id: res.data.id }));

            Alert.alert("Sent!", "A new code has been sent to your email.");

            // Reset Timer
            setIsResendDisabled(true);
            setTimer(120);
            setOtp(new Array(6).fill(''));
            inputRefs.current[0]?.focus();

        } catch (err) {
            setError('Could not resend code. Try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Format Timer (MM:SS)
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Get OTP input styling based on state
    const getOtpInputStyle = (index, digit) => {
        let baseStyle = 'w-12 h-14 rounded-2xl text-center text-2xl font-bold';

        if (error) {
            return `${baseStyle} border-2 border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400`;
        }

        if (focusedIndex === index) {
            return `${baseStyle} border-2 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400`;
        }

        if (digit) {
            return `${baseStyle} border-2 border-slate-800 dark:border-slate-300 bg-white dark:bg-slate-700 text-slate-800 dark:text-white`;
        }

        return `${baseStyle} border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500`;
    };

    return (
        <LinearGradient
            colors={isDark ? ['#0f172a', '#1e293b'] : ['#f8fafc', '#e2e8f0']}
            className="flex-1"
        >
            <SafeAreaView className="flex-1">
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 px-6"
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-4 mb-8 bg-white/80 dark:bg-slate-700/80 w-10 h-10 rounded-full items-center justify-center shadow-sm"
                    >
                        <ArrowLeft color={isDark ? "#e2e8f0" : "#334155"} size={22} />
                    </TouchableOpacity>

                    {/* Language Switcher */}
                    <View className="absolute top-4 right-0 z-50">
                        <TouchableOpacity
                            onPress={() => setShowLanguageModal(true)}
                            className="bg-white/80 dark:bg-slate-700/80 p-2.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-600"
                        >
                            <Globe size={22} color={isDark ? "#94a3b8" : "#475569"} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View className="items-center mb-10">
                            {/* Icon Badge */}
                            <View className="bg-blue-100 dark:bg-blue-900/30 w-20 h-20 rounded-full items-center justify-center mb-5">
                                <Text className="text-4xl">📧</Text>
                            </View>

                            <Text className="text-3xl font-extrabold text-slate-800 dark:text-white text-center mb-2">
                                {t('verify.Verification')}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-center text-base px-8">
                                {t('verify.WeveSent')}
                            </Text>
                            {ctx.email && (
                                <View className="bg-blue-100 dark:bg-blue-900/30 px-5 py-2 rounded-full mt-4 border border-blue-200 dark:border-blue-800">
                                    <Text className="text-blue-800 dark:text-blue-300 font-semibold">{ctx.email}</Text>
                                </View>
                            )}
                        </View>

                        {/* OTP Input Container */}
                        <View className="flex-row justify-between mb-8 px-2">
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => inputRefs.current[index] = ref}
                                    value={digit}
                                    onChangeText={(text) => handleChange(text, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    onFocus={() => setFocusedIndex(index)}
                                    onBlur={() => setFocusedIndex(-1)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    selectTextOnFocus
                                    className={getOtpInputStyle(index, digit)}
                                    style={{
                                        shadowColor: focusedIndex === index ? '#3b82f6' : 'transparent',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.25,
                                        shadowRadius: 4,
                                        elevation: focusedIndex === index ? 4 : 0
                                    }}
                                />
                            ))}
                        </View>

                        {/* Error Message */}
                        {error ? (
                            <View className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-5 rounded-r-xl mx-2">
                                <Text className="text-red-600 dark:text-red-400 font-medium text-center">
                                    {error}
                                </Text>
                            </View>
                        ) : null}

                        {/* Timer & Resend */}
                        <View className="items-center mb-8">
                            {isResendDisabled ? (
                                <View className="bg-slate-100 dark:bg-slate-800 px-5 py-3 rounded-full">
                                    <Text className="text-slate-500 dark:text-slate-400">
                                        {t('verify.Resend code in')} <Text className="font-bold text-slate-700 dark:text-slate-200">{formatTime(timer)}</Text>
                                    </Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={resendOtp}
                                    className="bg-blue-50 dark:bg-blue-900/30 px-6 py-3 rounded-full border border-blue-200 dark:border-blue-700"
                                >
                                    <Text className="text-blue-600 dark:text-blue-400 font-bold text-lg">{t('verify.Resend code')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Verify Button */}
                        <TouchableOpacity
                            onPress={verifyOtp}
                            disabled={loading || otp.join('').length !== 6}
                            className={`w-full py-4 rounded-2xl items-center mx-2 ${loading || otp.join('').length !== 6
                                    ? 'bg-slate-300 dark:bg-slate-600'
                                    : 'bg-blue-600 dark:bg-blue-500 shadow-lg'
                                }`}
                            style={{
                                width: '95%',
                                shadowColor: '#3b82f6',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: loading ? 0 : 0.3,
                                shadowRadius: 8,
                                elevation: loading ? 0 : 6
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">{t('verify.Verify & Proceed')}</Text>
                            )}
                        </TouchableOpacity>

                        {/* Security Note */}
                        <View className="mt-8 items-center px-4">
                            <Text className="text-slate-400 dark:text-slate-500 text-xs text-center">
                                🔒 Your verification is secure and encrypted
                            </Text>
                        </View>

                        <LanguageModal
                            visible={showLanguageModal}
                            onClose={() => setShowLanguageModal(false)}
                        />

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}