import { useRouter } from 'expo-router';
import { ArrowLeft, Code, User, Users } from 'lucide-react-native';
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

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View className="px-4 py-4 flex-row items-center bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ArrowLeft size={24} color={isDark ? "#f8fafc" : "#0f172a"} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('about.title')}</Text>
            </View>

            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                {/* Logo & Description */}
                <View className="items-center mb-10">
                    <Image
                        source={require('../assets/logo.png')}
                        className="w-24 h-24 mb-6 rounded-3xl"
                        resizeMode="contain"
                    />
                    <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 text-center">
                        {t('about.appName')}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-center leading-6 px-4">
                        {t('about.description')}
                    </Text>
                </View>

                {/* Team Section */}
                <Text className="text-slate-900 dark:text-slate-100 font-bold text-lg mb-4 flex-row items-center">
                    <Users size={20} className="mr-2" color={isDark ? "#f8fafc" : "#0f172a"} />
                    <Text>{t('about.meetTeam')}</Text>
                </Text>

                <View className="flex-row justify-between mb-8">
                    <TeamMember name="Man" role={t('about.frontendDeveloper')} color="blue" />
                    <TeamMember name="Dhruv" role={t('about.backendDeveloper')} color="purple" />
                </View>

                {/* Additional Info / Links */}
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 space-y-4">
                    <TouchableOpacity onPress={() => Linking.openURL('https://mechanicsetu.com')}>
                        <Text className="text-slate-900 dark:text-slate-100 font-semibold">{t('about.website')}</Text>
                        <Text className="text-slate-500 text-xs">www.mechanicsetu.com</Text>
                    </TouchableOpacity>

                    <View className="h-px bg-slate-100 dark:bg-slate-700" />

                    <TouchableOpacity onPress={() => Linking.openURL('mailto:support@mechanicsetu.com')}>
                        <Text className="text-slate-900 dark:text-slate-100 font-semibold">{t('about.contactSupport')}</Text>
                        <Text className="text-slate-500 text-xs">support@mechanicsetu.com</Text>
                    </TouchableOpacity>
                </View>

                <View className="items-center mt-10 mb-6">
                    <Text className="text-slate-400 text-xs">
                        {t('about.copyright')}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
