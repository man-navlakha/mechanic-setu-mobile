import { useRouter } from 'expo-router';
import { ArrowLeft, Code, Info, Layers, Monitor, Shield, Smartphone, User, Users } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import {
    Image,
    Linking,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const { t } = useTranslation();
    const isDark = colorScheme === 'dark';

    const TeamMember = ({ name, role, color }) => (
        <View className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 items-center justify-center shadow-sm mx-1">
            <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                {color === 'blue' ? (
                    <User size={24} color={isDark ? '#60a5fa' : '#2563eb'} />
                ) : (
                    <Code size={24} color={isDark ? '#c084fc' : '#9333ea'} />
                )}
            </View>
            <Text className="text-slate-900 dark:text-slate-100 font-bold text-center">{name}</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-xs text-center mt-1">{role}</Text>
        </View>
    );

    const InfoSection = ({ title, content, icon: Icon }) => (
        <View className="mb-6">
            <View className="flex-row items-center mb-2">
                {Icon && <Icon size={20} color={isDark ? '#cbd5e1' : '#475569'} className="mr-2" />}
                <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {title}
                </Text>
            </View>
            <Text className="text-slate-600 dark:text-slate-400 text-sm leading-6">
                {content}
            </Text>
        </View>
    );

    const PermissionItem = ({ title, reason, icon: Icon }) => (
        <View className="flex-row mb-4 items-start">
            <View className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg mr-3">
                {Icon && <Icon size={16} color={isDark ? '#94a3b8' : '#64748b'} />}
            </View>
            <View className="flex-1">
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-0.5">{title}</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 leading-4">{reason}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View className="px-4 py-4 flex-row items-center bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ArrowLeft size={24} color={isDark ? "#f8fafc" : "#0f172a"} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('about.title') || "About"}</Text>
            </View>

            <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>

                {/* 1. App Header */}
                <View className="items-center mb-8">
                    <Image
                        source={require('../assets/logo.png')}
                        className="w-20 h-20 mb-4 rounded-2xl"
                        resizeMode="contain"
                    />
                    <Text className="text-2xl font-black text-slate-900 dark:text-slate-100 text-center">
                        Setu Partner
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm text-center font-medium">
                        v1.6.3
                    </Text>
                </View>

                {/* 2. About This App */}
                <View className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6 shadow-sm">
                    <InfoSection
                        title="About This App"
                        icon={Smartphone}
                        content="Setu Partner is the dedicated companion app for mechanics registered on the Mechanic Setu platform. It empowers mechanics to receive real-time job requests, manage their service history, track earnings, and navigate to customer locations efficiently."
                    />
                </View>

                {/* 3. About Mechanic Setu */}
                <View className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50 mb-6">
                    <InfoSection
                        title="About Mechanic Setu"
                        icon={Layers}
                        content="Mechanic Setu is a bridge connecting vehicle owners in distress with reliable local mechanics. Our mission is to reduce breakdown downtime and ensure that help is always just a few taps away, anywhere and anytime."
                    />
                </View>

                {/* 4. Team Section */}
                <View className="mb-8">
                    <View className="flex-row items-center mb-4">
                        <Users size={20} color={isDark ? '#cbd5e1' : '#475569'} className="mr-2" />
                        <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            Our Team
                        </Text>
                    </View>
                    <View className="flex-row justify-between">
                        <TeamMember name="Man" role="Frontend Developer & UI/UX" color="blue" />
                        <TeamMember name="Dhruv" role="Backend Developer & Systems" color="purple" />
                    </View>
                </View>

                {/* 5. System Requirements */}
                <View className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6 shadow-sm">
                    <View className="flex-row items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                        <Monitor size={20} color={isDark ? '#cbd5e1' : '#475569'} className="mr-2" />
                        <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            System Requirements
                        </Text>
                    </View>

                    <Text className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        <Text className="font-bold text-slate-800 dark:text-slate-200">OS:</Text> Android 8.0 (Oreo) or higher
                    </Text>
                    <Text className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        <Text className="font-bold text-slate-800 dark:text-slate-200">RAM:</Text> 4GB Minimum Recommended
                    </Text>
                    <Text className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        <Text className="font-bold text-slate-800 dark:text-slate-200">GPS:</Text> High-accuracy location support required
                    </Text>
                    <Text className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        <Text className="font-bold text-slate-800 dark:text-slate-200">Internet:</Text> Stable 4G/5G/Wi-Fi connection
                    </Text>
                </View>

                {/* 6. Permissions */}
                <View className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 mb-8 shadow-sm">
                    <View className="flex-row items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                        <Shield size={20} color={isDark ? '#cbd5e1' : '#475569'} className="mr-2" />
                        <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            Permissions Explained
                        </Text>
                    </View>

                    <PermissionItem
                        title="Location (Always/Background)"
                        reason="To allow customers to find you and track your arrival even when the app is in the background."
                        icon={Map} // will import below or use generic
                    />
                    <PermissionItem
                        title="Display Over Other Apps"
                        reason="To show urgent job alerts immediately on top of other applications so you never miss a request."
                        icon={Monitor}
                    />
                    <PermissionItem
                        title="Notifications"
                        reason="To send you updates about job status, payments, and system announcements."
                        icon={Info}
                    />
                </View>

                {/* Footer Links */}
                <View className="items-center space-y-2 mb-10">
                    <TouchableOpacity onPress={() => Linking.openURL('https://mechanicsetu.com')}>
                        <Text className="text-blue-600 dark:text-blue-400 font-semibold">Visit Website</Text>
                    </TouchableOpacity>
                    <Text className="text-slate-300 dark:text-slate-600 text-xs">
                        © 2025 Mechanic Setu. All rights reserved.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

// Quick Icon Fix if Map not imported
const Map = (props) => (
    <Monitor {...props} /> // Fallback or add MapPin to imports
);

