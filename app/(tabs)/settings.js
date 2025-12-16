
import { useRouter } from 'expo-router';
import { ChevronRight, Globe, LogOut, Moon, Sun } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LanguageModal from '../../components/LanguageModal';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { logout } = useAuth();
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const insets = useSafeAreaInsets();

    const handleLogout = async () => {
        Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
            { text: t('profile.cancel'), style: "cancel" },
            {
                text: t('profile.logout'),
                style: "destructive",
                onPress: async () => {
                    await logout();
                    router.replace('/login');
                }
            }
        ]);
    };

    const SettingItem = ({ icon, title, subtitle, onPress, rightElement }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className="flex-row items-center bg-white dark:bg-slate-800 p-4 mb-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
        >
            <View className={`p-3 rounded-xl mr-4 ${isDark ? 'bg-slate-700' : 'bg-slate-100'} `}>
                {icon}
            </View>
            <View className="flex-1">
                <Text className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</Text>
                {subtitle && <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</Text>}
            </View>
            {rightElement || <ChevronRight size={20} color={isDark ? "#64748b" : "#cbd5e1"} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <View className="px-4 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">Settings</Text>
            </View>

            <View className="p-4 flex-1">
                <Text className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs mb-3 ml-1">Preferences</Text>

                <SettingItem
                    icon={<Globe size={24} color={isDark ? "#60a5fa" : "#2563eb"} />}
                    title="Language"
                    subtitle="Change app language"
                    onPress={() => setShowLanguageModal(true)}
                />

                <SettingItem
                    icon={isDark ? <Moon size={24} color="#a78bfa" /> : <Sun size={24} color="#f59e0b" />}
                    title="Dark Mode"
                    subtitle={isDark ? "Dark mode is on" : "Light mode is on"}
                    onPress={toggleColorScheme}
                    rightElement={
                        <Switch
                            value={isDark}
                            onValueChange={toggleColorScheme}
                            trackColor={{ false: "#cbd5e1", true: "#818cf8" }}
                            thumbColor={isDark ? "#ffffff" : "#f4f4f5"}
                        />
                    }
                />

                <Text className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs mb-3 ml-1 mt-6">Account</Text>

                <TouchableOpacity
                    onPress={handleLogout}
                    className="mt-2 bg-red-50 dark:bg-red-900/30 p-4 rounded-2xl flex-row items-center justify-center border border-red-100 dark:border-red-800 active:bg-red-100 dark:active:bg-red-900/50"
                >
                    <LogOut size={20} color={isDark ? "#f87171" : "#dc2626"} className="mr-2" />
                    <Text className="text-red-600 dark:text-red-400 font-bold text-base">{t('profile.logout')}</Text>
                </TouchableOpacity>

                <View className="mt-auto items-center pb-4" style={{ paddingBottom: 80 + insets.bottom }}>
                    <Text className="text-slate-400 text-xs">Mechanic Setu Partner App</Text>
                    <Text className="text-slate-400 text-xs">Version 1.0.0</Text>
                </View>
            </View>

            <LanguageModal
                visible={showLanguageModal}
                onClose={() => setShowLanguageModal(false)}
            />
        </SafeAreaView>
    );
}
