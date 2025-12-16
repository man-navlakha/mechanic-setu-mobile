import { History, MapPin } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../utils/api';

export default function HistoryScreen() {
    const { t } = useTranslation();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    const [historyData, setHistoryData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/Profile/MechanicHistory/');
                setHistoryData(res.data);
            } catch (error) {
                console.error("Failed to fetch history:", error);
                Alert.alert("Error", "Could not load history.");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
                <ActivityIndicator size="large" color={isDark ? "#60a5fa" : "#2563eb"} />
            </View>
        );
    }

    const jobs = historyData?.job_history || [];

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <View className="px-4 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('profile.jobHistory') || "Job History"}</Text>
            </View>

            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                {jobs.length === 0 ? (
                    <View className="items-center py-20">
                        <History size={48} color={isDark ? "#475569" : "#cbd5e1"} />
                        <Text className="text-slate-400 dark:text-slate-500 font-medium mt-4">{t('profile.noHistory') || "No job history found."}</Text>
                    </View>
                ) : (
                    jobs.map((job, index) => (
                        <View key={index} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 mb-3 shadow-sm">
                            <View className="flex-row justify-between items-start mb-2">
                                <Text className="font-bold text-slate-800 dark:text-slate-100 text-base flex-1 mr-2">{job.problem}</Text>
                                <View className={`px-2 py-1 rounded-md ${job.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                    <Text className={`text-[10px] font-bold ${job.status === 'COMPLETED' ? 'text-green-700 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {job.status}
                                    </Text>
                                </View>
                            </View>

                            <Text className="text-slate-500 dark:text-slate-400 text-xs mb-3">{new Date(job.created_at).toDateString()}</Text>

                            <View className="flex-row justify-between items-center border-t border-slate-50 dark:border-slate-700 pt-3">
                                <Text className="text-slate-400 dark:text-slate-500 text-xs max-w-[70%]" numberOfLines={1}>
                                    <MapPin size={10} color={isDark ? "#64748b" : "#94a3b8"} /> {job.location || "Unknown Location"}
                                </Text>
                                <Text className="font-bold text-slate-900 dark:text-slate-100 text-base">₹{job.price || 0}</Text>
                            </View>
                        </View>
                    ))
                )}
                <View style={{ height: 80 + insets.bottom }} />
            </ScrollView>
        </SafeAreaView>
    );
}
